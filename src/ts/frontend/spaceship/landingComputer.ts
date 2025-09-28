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
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { getAngleFromQuaternion, getAxisFromQuaternion, getDeltaQuaternion } from "@/frontend/helpers/algebra";
import { type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { CollisionMask } from "@/settings";

export const enum LandingTargetKind {
    LANDING_PAD,
    CELESTIAL_BODY,
}

export type LandingTargetPad = {
    kind: LandingTargetKind.LANDING_PAD;
    landingPad: ILandingPad;
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
    } | null;

    /**
     * The maximum velocity at any point during the step
     */
    maxVelocity: {
        linearY: number;
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

export const LandingComputerStatusBit = {
    PROGRESS: 1 << 0,
    COMPLETE: 1 << 1,
    TIMEOUT: 1 << 2,
    IDLE: 1 << 3,
    NO_LANDING_SPOT: 1 << 4,
} as const;

export type LandingComputerStatusBit = (typeof LandingComputerStatusBit)[keyof typeof LandingComputerStatusBit];

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

    private createLandingPadActionPlan(landingPad: ILandingPad): ReadonlyArray<LandingPlanStep> {
        return [
            {
                getTargetTransform: () => {
                    return {
                        position: landingPad
                            .getTransform()
                            .getAbsolutePosition()
                            .add(landingPad.getTransform().up.scale(50)),
                        rotation: landingPad.getTransform().absoluteRotationQuaternion,
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1,
                },
                maxVelocity: {
                    linearY: 20,
                    rotation: 0.5,
                },
                tolerance: {
                    position: 1.5,
                    rotation: 0.1,
                },
            },
            {
                getTargetTransform: () => {
                    return {
                        position: landingPad
                            .getTransform()
                            .getAbsolutePosition()
                            .add(
                                landingPad
                                    .getTransform()
                                    .up.scale((landingPad.getPadHeight() + this.boundingExtent.y) / 2),
                            ),
                        rotation: landingPad.getTransform().absoluteRotationQuaternion,
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1,
                },
                maxVelocity: {
                    linearY: 5,
                    rotation: 0.5,
                },
                tolerance: {
                    position: 0.5,
                    rotation: 0.1,
                },
            },
        ];
    }

    private createSurfaceActionPlan(celestialBody: TransformNode): ReadonlyArray<LandingPlanStep> {
        return [
            {
                getTargetTransform: () => {
                    const shipPosition = this.transform.getAbsolutePosition();
                    const gravityDir = celestialBody.position.subtract(shipPosition).normalize();

                    const start = shipPosition.add(gravityDir.scale(-100));
                    const end = shipPosition.add(gravityDir.scale(500));

                    this.physicsEngine.raycastToRef(start, end, this.raycastResult, {
                        collideWith: CollisionMask.ENVIRONMENT,
                    });

                    if (!this.raycastResult.hasHit) {
                        return null;
                    }

                    const landingSpotNormal = this.raycastResult.hitNormalWorld;

                    const landingSpotPosition = this.raycastResult.hitPointWorld.add(
                        landingSpotNormal.scale(this.boundingExtent.y / 2),
                    );

                    const currentUp = this.transform.up;
                    const targetUp = landingSpotNormal;

                    if (currentUp.equalsWithEpsilon(targetUp)) {
                        return {
                            position: landingSpotPosition,
                            rotation: this.transform.absoluteRotationQuaternion,
                        };
                    }

                    const axis = Vector3.Cross(currentUp, targetUp);
                    const theta = Math.acos(Vector3.Dot(currentUp, targetUp));

                    return {
                        position: landingSpotPosition,
                        rotation: Quaternion.RotationAxis(axis, theta).multiplyInPlace(
                            this.transform.absoluteRotationQuaternion,
                        ),
                    };
                },
                maxVelocityAtTarget: {
                    linear: 3,
                    rotation: 0.1,
                },
                maxVelocity: {
                    linearY: 5,
                    rotation: 0.5,
                },
                tolerance: {
                    position: 5.0,
                    rotation: 0.2,
                },
            },
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

        const targetTransform = currentAction.getTargetTransform();
        if (targetTransform === null) {
            return LandingComputerStatusBit.NO_LANDING_SPOT;
        }

        const { position: targetPosition, rotation: targetRotation } = targetTransform;
        const { position: positionTolerance, rotation: rotationTolerance } = currentAction.tolerance;
        const { linear: maxSpeedAtTarget, rotation: maxRotationSpeedAtTarget } = currentAction.maxVelocityAtTarget;
        const { linearY: maxLinearSpeedY, rotation: maxRotationSpeed } = currentAction.maxVelocity;

        const currentPosition = this.transform.getAbsolutePosition();
        const currentRotation = this.transform.absoluteRotationQuaternion;

        const currentLinearVelocity = this.aggregate.body.getLinearVelocity();
        const currentAngularVelocity = this.aggregate.body.getAngularVelocity();

        const distance = Vector3.Distance(targetPosition, currentPosition);
        const directionToTarget = targetPosition.subtract(currentPosition).normalize();

        const deltaQuaternion = getDeltaQuaternion(currentRotation, targetRotation);
        const deltaAngle = getAngleFromQuaternion(deltaQuaternion);

        if (
            distance <= positionTolerance &&
            Math.abs(deltaAngle) <= rotationTolerance &&
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

        const mass = this.aggregate.body.getMassProperties().mass ?? 1;

        // Decompose the direction to target along the ship's axes
        const shipXAxis = this.transform.right;
        const shipYAxis = this.transform.up;
        const shipZAxis = this.transform.forward;

        const targetSpeedX = directionToTarget.dot(shipXAxis) * maxLinearSpeedY * 2;
        const targetSpeedY = directionToTarget.dot(shipYAxis) * maxLinearSpeedY;
        const targetSpeedZ = directionToTarget.dot(shipZAxis) * maxLinearSpeedY * 2;

        const currentSpeedX = currentLinearVelocity.dot(shipXAxis);
        const currentSpeedY = currentLinearVelocity.dot(shipYAxis);
        const currentSpeedZ = currentLinearVelocity.dot(shipZAxis);

        // Apply forces along each axis
        this.aggregate.body.applyForce(shipXAxis.scale(mass * (targetSpeedX - currentSpeedX)), currentPosition);
        this.aggregate.body.applyForce(shipYAxis.scale(mass * (targetSpeedY - currentSpeedY)), currentPosition);
        this.aggregate.body.applyForce(shipZAxis.scale(mass * (targetSpeedZ - currentSpeedZ)), currentPosition);

        const currentSpeedTowardTarget = currentLinearVelocity.dot(directionToTarget);
        const otherSpeed = currentLinearVelocity.subtract(directionToTarget.scale(currentSpeedTowardTarget));

        // damp speed along other directions
        this.aggregate.body.applyForce(otherSpeed.scale(-5 * mass), currentPosition);

        const deltaRotation = getDeltaQuaternion(currentRotation, targetRotation);
        const rotationAngle = getAngleFromQuaternion(deltaRotation);
        const rotationAxis = getAxisFromQuaternion(deltaRotation);

        const angularVelocity = this.aggregate.body.getAngularVelocity();

        const currentRotationSpeed = angularVelocity.dot(rotationAxis);
        const targetRotationSpeed =
            Math.sign(rotationAngle) * Math.min(maxRotationSpeed, 0.4 * Math.sqrt(Math.abs(rotationAngle)));

        const rotationImpulseStrength = 10 * (targetRotationSpeed - currentRotationSpeed);

        this.aggregate.body.applyAngularImpulse(rotationAxis.scale(rotationImpulseStrength));

        const otherRotationSpeed = angularVelocity.subtract(rotationAxis.scale(currentRotationSpeed));
        this.aggregate.body.applyAngularImpulse(otherRotationSpeed.scale(-2));

        if (this.elapsedSeconds > this.maxSecondsPerPlan) {
            this.setTarget(null);
            return LandingComputerStatusBit.TIMEOUT;
        }

        return LandingComputerStatusBit.PROGRESS;
    }
}
