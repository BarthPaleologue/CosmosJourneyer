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

import { type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { CollisionMask } from "@/settings";

import { AttitudePDController } from "./attitudePdController";
import { PositionPDController } from "./positionPdController";

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

    private readonly positionController: PositionPDController;
    private readonly attitudeController: AttitudePDController;

    constructor(aggregate: PhysicsAggregate, physicsEngine: PhysicsEngineV2) {
        this.aggregate = aggregate;
        this.transform = aggregate.transformNode;

        this.physicsEngine = physicsEngine;

        const boundingVectors = this.transform.getHierarchyBoundingVectors();
        this.boundingExtent = boundingVectors.max.subtract(boundingVectors.min);

        this.positionController = new PositionPDController(4, 4);
        this.attitudeController = new AttitudePDController(8, 4);
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

        const currentPosition = this.transform.getAbsolutePosition();
        const currentRotation = this.transform.absoluteRotationQuaternion;

        const currentLinearVelocity = this.aggregate.body.getLinearVelocity();
        const currentAngularVelocity = this.aggregate.body.getAngularVelocity();

        const distance = Vector3.Distance(targetPosition, currentPosition);
        if (
            distance <= positionTolerance &&
            Quaternion.AreClose(currentRotation, targetRotation, rotationTolerance) &&
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

        const massProps = this.aggregate.body.getMassProperties();
        const mass = massProps.mass ?? 1;

        const force = this.positionController.computeForceToRef(
            {
                position: currentPosition,
                velocity: currentLinearVelocity,
            },
            {
                position: targetPosition,
                velocity: Vector3.ZeroReadOnly,
            },
            mass,
            Vector3.Zero(),
        );

        this.aggregate.body.applyForce(force, currentPosition);

        const inertia = massProps.inertia ?? new Vector3(1, 1, 1);
        const inertiaOrientation = massProps.inertiaOrientation ?? Quaternion.Identity();
        const attitudeTorque = this.attitudeController.computeTorqueToRef(
            {
                orientation: currentRotation,
                angularVelocity: currentAngularVelocity,
            },
            {
                orientation: targetRotation,
                angularVelocity: Vector3.ZeroReadOnly,
            },
            { mass, inertia, inertiaOrientation },
            Vector3.Zero(),
        );

        this.aggregate.body.applyAngularImpulse(attitudeTorque.scale(deltaSeconds));

        if (this.elapsedSeconds > this.maxSecondsPerPlan) {
            this.setTarget(null);
            return LandingComputerStatusBit.TIMEOUT;
        }

        return LandingComputerStatusBit.PROGRESS;
    }
}
