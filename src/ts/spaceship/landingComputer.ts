//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { CollisionMask } from "../settings";
import { getAngleFromQuaternion, getAxisFromQuaternion, getDeltaQuaternion } from "../utils/algebra";

export const enum LandingTargetKind {
    LANDING_PAD,
    CELESTIAL_BODY
}

export type LandingTargetPad = {
    kind: LandingTargetKind.LANDING_PAD;
    landingPad: LandingPad;
};

export type LandingTargetCelestialBody = {
    kind: LandingTargetKind.CELESTIAL_BODY;
    celestialBody: TransformNode;
};

export type LandingTarget = LandingTargetPad | LandingTargetCelestialBody;

/**
 * One step in a plan of action for a transformable object subject to physics
 */
type LandingPlanStep = {
    /**
     * @returns The target position and rotation for the transformable object in this step
     */
    getTargetTransform: () => {
        /**
         * The position to reach
         */
        position: Vector3;

        /**
         * The rotation to reach
         */
        rotation: Quaternion;
    };

    /**
     * The maximum velocity at any point during the step
     */
    maxVelocity: {
        linear: number;
        rotation: number;
    };

    /**
     * The maximum velocity when reaching the target before the step is considered complete
     */
    maxVelocityAtTarget: {
        linear: number;
        rotation: number;
    };

    /**
     * The tolerance margin to consider the step complete
     */
    tolerance: {
        /**
         * The maximum distance to the target position
         */
        position: number;

        /**
         * The maximum deviation between the target and current up vectors
         */
        rotation: number;
    };
};

export const enum LandingComputerStatusBit {
    PROGRESS = 1 << 0,
    COMPLETE = 1 << 1,
    TIMEOUT = 1 << 2,
    IDLE = 1 << 3
}

export class LandingComputer {
    private readonly physicsEngine: PhysicsEngineV2;

    private target: LandingTarget | null = null;

    private actionPlan: ReadonlyArray<LandingPlanStep> | null = null;

    private currentActionIndex = 0;

    private readonly aggregate: PhysicsAggregate;
    private readonly transform: TransformNode;
    private readonly raycastResult = new PhysicsRaycastResult();

    private readonly boundingExtent: Vector3;

    private elapsedSeconds = 0;
    private readonly maxSecondsPerPlan = 90;

    constructor(aggregate: PhysicsAggregate, physicsEngine: PhysicsEngineV2) {
        this.aggregate = aggregate;
        this.transform = aggregate.transformNode;

        this.physicsEngine = physicsEngine;

        const boundingVectors = this.transform.getHierarchyBoundingVectors();
        this.boundingExtent = boundingVectors.max.subtract(boundingVectors.min);
    }

    getTarget() {
        return this.target;
    }

    setTarget(target: LandingTarget | null) {
        this.target = target;
        this.currentActionIndex = 0;
        this.elapsedSeconds = 0;

        if (this.target === null) {
            this.actionPlan = null;
            return;
        }

        switch (this.target.kind) {
            case LandingTargetKind.LANDING_PAD:
                this.actionPlan = this.createLandingPadActionPlan(this.target.landingPad);
                break;
            case LandingTargetKind.CELESTIAL_BODY:
                this.actionPlan = this.createSurfaceActionPlan(this.target.celestialBody);
                break;
        }
    }

    private createLandingPadActionPlan(landingPad: LandingPad): ReadonlyArray<LandingPlanStep> {
        return [
            {
                getTargetTransform: () => {
                    return {
                        position: landingPad
                            .getTransform()
                            .getAbsolutePosition()
                            .add(landingPad.getTransform().up.scale(50)),
                        rotation: landingPad.getTransform().absoluteRotationQuaternion
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1
                },
                maxVelocity: {
                    linear: 20,
                    rotation: 0.5
                },
                tolerance: {
                    position: 1.5,
                    rotation: 0.1
                }
            },
            {
                getTargetTransform: () => {
                    return {
                        position: landingPad
                            .getTransform()
                            .getAbsolutePosition()
                            .add(
                                landingPad.getTransform().up.scale((landingPad.padHeight + this.boundingExtent.y) / 2)
                            ),
                        rotation: landingPad.getTransform().absoluteRotationQuaternion
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1
                },
                maxVelocity: {
                    linear: 5,
                    rotation: 0.5
                },
                tolerance: {
                    position: 0.5,
                    rotation: 0.1
                }
            }
        ];
    }

    private createSurfaceActionPlan(celestialBody: TransformNode): ReadonlyArray<LandingPlanStep> {
        return [
            {
                getTargetTransform: () => {
                    const shipPosition = this.transform.getAbsolutePosition();
                    const gravityDir = celestialBody.position.subtract(shipPosition).normalize();

                    const start = shipPosition.add(gravityDir.scale(-50e3));
                    const end = shipPosition.add(gravityDir.scale(50e3));

                    this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
                        collideWith: CollisionMask.ENVIRONMENT
                    });

                    if (!this.raycastResult.hasHit) {
                        throw new Error("No landing spot found");
                    }

                    const landingSpotNormal = this.raycastResult.hitNormalWorld;

                    const currentUp = this.transform.up;
                    const targetUp = landingSpotNormal;

                    if (currentUp.equalsWithEpsilon(targetUp)) {
                        return {
                            position: this.raycastResult.hitPointWorld,
                            rotation: this.transform.absoluteRotationQuaternion
                        };
                    }

                    const axis = Vector3.Cross(currentUp, targetUp);
                    const theta = Math.acos(Vector3.Dot(currentUp, targetUp));

                    return {
                        position: this.raycastResult.hitPointWorld,
                        rotation: this.transform.absoluteRotationQuaternion.multiply(
                            Quaternion.RotationAxis(axis, theta)
                        )
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1
                },
                maxVelocity: {
                    linear: 15,
                    rotation: 0.5
                },
                tolerance: {
                    position: 2.0,
                    rotation: 0.2
                }
            }
        ];
    }

    update(deltaSeconds: number): LandingComputerStatusBit {
        if (this.target === null || this.actionPlan === null) {
            return LandingComputerStatusBit.IDLE;
        }

        const currentAction = this.actionPlan.at(this.currentActionIndex);
        if (currentAction === undefined) {
            return LandingComputerStatusBit.COMPLETE;
        }

        this.elapsedSeconds += deltaSeconds;

        const { position: targetPosition, rotation: targetRotation } = currentAction.getTargetTransform();
        const { position: positionTolerance, rotation: rotationTolerance } = currentAction.tolerance;
        const { linear: maxSpeedAtTarget, rotation: maxRotationSpeedAtTarget } = currentAction.maxVelocityAtTarget;
        const { linear: maxLinearSpeed, rotation: maxRotationSpeed } = currentAction.maxVelocity;

        const currentPosition = this.transform.getAbsolutePosition();
        const currentRotation = this.transform.absoluteRotationQuaternion;

        const currentLinearVelocity = this.aggregate.body.getLinearVelocity();
        const currentAngularVelocity = this.aggregate.body.getAngularVelocity();

        const distance = Vector3.Distance(targetPosition, currentPosition);
        const directionToTarget = targetPosition.subtract(currentPosition).normalize();

        const shipUp = this.transform.up;
        const targetUp = Vector3.Up().applyRotationQuaternionInPlace(targetRotation);

        if (
            distance <= positionTolerance &&
            shipUp.equalsWithEpsilon(targetUp, rotationTolerance) &&
            currentLinearVelocity.length() < maxSpeedAtTarget &&
            currentAngularVelocity.length() < maxRotationSpeedAtTarget
        ) {
            if (this.currentActionIndex === this.actionPlan.length - 1) {
                this.setTarget(null);
                return LandingComputerStatusBit.COMPLETE;
            }

            this.currentActionIndex++;
            return LandingComputerStatusBit.PROGRESS;
        }

        const currentSpeedTowardTarget = currentLinearVelocity.dot(directionToTarget);

        const otherSpeed = currentLinearVelocity.subtract(directionToTarget.scale(currentSpeedTowardTarget));

        const mass = this.aggregate.body.getMassProperties().mass ?? 1;

        // move toward target
        const targetSpeedTowardTarget = Math.min(distance * 3.0, maxLinearSpeed);
        this.aggregate.body.applyForce(
            directionToTarget.scale(mass * (targetSpeedTowardTarget - currentSpeedTowardTarget)),
            currentPosition
        );

        // damp speed along other directions
        this.aggregate.body.applyForce(otherSpeed.scale(-2 * mass), currentPosition);

        const deltaRotation = getDeltaQuaternion(currentRotation, targetRotation);
        const rotationAngle = getAngleFromQuaternion(deltaRotation);
        const rotationAxis = getAxisFromQuaternion(deltaRotation);

        const angularVelocity = this.aggregate.body.getAngularVelocity();

        const currentRotationSpeed = angularVelocity.dot(rotationAxis);
        const targetRotationSpeed =
            Math.sign(rotationAngle) * Math.min(maxRotationSpeed, 0.4 * Math.sqrt(Math.abs(rotationAngle)));

        const otherRotationSpeed = angularVelocity.subtract(rotationAxis.scale(currentRotationSpeed));

        const rotationImpulseStrength = 20 * (targetRotationSpeed - currentRotationSpeed);

        this.aggregate.body.applyAngularImpulse(rotationAxis.scale(rotationImpulseStrength));

        this.aggregate.body.applyAngularImpulse(otherRotationSpeed.scale(-2));

        if (this.elapsedSeconds > this.maxSecondsPerPlan) {
            this.setTarget(null);
            return LandingComputerStatusBit.TIMEOUT;
        }

        return LandingComputerStatusBit.PROGRESS;
    }
}
