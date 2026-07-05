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

import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { EarthG } from "@cosmos-journeyer/physics";
import { assertUnreachable } from "@cosmos-journeyer/typescript";

import { type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { CollisionMask } from "@/settings";

import { AttitudePDController } from "./attitudePdController";
import { PositionPDController } from "./positionPdController";

export type LandingTargetPad = {
    kind: "landing_pad";
    landingPad: ILandingPad;
};

export type LandingTargetCelestialBody = {
    kind: "celestial_body";
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

export const LandingComputerStatusBit = {
    PROGRESS: 1,
    LANDING_COMPLETE: 2,
    TIMEOUT: 4,
    IDLE: 8,
    NO_LANDING_SPOT: 16,
    LIFTOFF_COMPLETE: 32,
} as const;

export type LandingComputerStatusBit = (typeof LandingComputerStatusBit)[keyof typeof LandingComputerStatusBit];

type LandingComputerCompleteStatus =
    | typeof LandingComputerStatusBit.LANDING_COMPLETE
    | typeof LandingComputerStatusBit.LIFTOFF_COMPLETE;

export class LandingComputer {
    private readonly physicsEngine: PhysicsEngineV2;

    private target: LandingTarget | null = null;

    private actionPlan: ReadonlyArray<LandingPlanStep> | null = null;
    private completeStatus: LandingComputerCompleteStatus = LandingComputerStatusBit.LANDING_COMPLETE;

    private currentActionIndex = 0;

    private readonly aggregate: PhysicsAggregate;
    private readonly transform: TransformNode;
    private readonly raycastResult = new PhysicsRaycastResult();

    private readonly boundingExtent: Vector3;

    private elapsedSeconds = 0;
    private readonly maxSecondsPerPlan = 90;

    private readonly positionController: PositionPDController;
    private readonly attitudeController: AttitudePDController;

    private readonly tmpForce = new Vector3();
    private readonly tmpTorque = new Vector3();

    constructor(aggregate: PhysicsAggregate, physicsEngine: PhysicsEngineV2) {
        this.aggregate = aggregate;
        this.transform = aggregate.transformNode;

        this.physicsEngine = physicsEngine;

        const boundingVectors = this.transform.getHierarchyBoundingVectors();
        this.boundingExtent = boundingVectors.max.subtract(boundingVectors.min);

        this.positionController = new PositionPDController(1, 4);
        this.attitudeController = new AttitudePDController(4, 4);
    }

    getTarget() {
        return this.target;
    }

    isActive() {
        return this.actionPlan !== null;
    }

    setTarget(target: LandingTarget | null) {
        this.target = target;
        this.currentActionIndex = 0;
        this.elapsedSeconds = 0;

        if (this.target === null) {
            this.actionPlan = null;
            return;
        }

        this.completeStatus = LandingComputerStatusBit.LANDING_COMPLETE;

        switch (this.target.kind) {
            case "landing_pad":
                this.actionPlan = this.createLandingPadActionPlan(this.target.landingPad);
                break;
            case "celestial_body":
                this.actionPlan = this.createSurfaceActionPlan(this.target.celestialBody);
                break;
            default:
                return assertUnreachable(this.target);
        }
    }

    liftOff() {
        this.target = null;
        this.currentActionIndex = 0;
        this.elapsedSeconds = 0;
        this.completeStatus = LandingComputerStatusBit.LIFTOFF_COMPLETE;
        this.actionPlan = this.createLiftOffActionPlan();
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
                    linear: 20,
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
                    linear: 5,
                    rotation: 0.5,
                },
                tolerance: {
                    position: 0.5,
                    rotation: 0.1,
                },
            },
        ];
    }

    private createLiftOffActionPlan(): ReadonlyArray<LandingPlanStep> {
        const currentPosition = this.transform.getAbsolutePosition();
        const currentRotation = this.transform.absoluteRotationQuaternion.clone();
        const currentUp = this.transform.up;
        const currentForward = this.transform.forward;
        const currentRight = this.transform.right;

        const targetPosition = currentPosition.add(currentUp.scale(15));
        const targetForward = Vector3.TransformCoordinates(
            currentForward,
            Matrix.RotationAxis(currentRight, -Math.PI / 6),
        );

        const deltaRotation = Quaternion.FromUnitVectorsToRef(currentForward, targetForward, Quaternion.Identity());
        const targetRotation = deltaRotation.multiply(currentRotation);

        return [
            {
                getTargetTransform: () => {
                    return {
                        position: targetPosition,
                        rotation: targetRotation,
                    };
                },
                maxVelocityAtTarget: {
                    linear: 5,
                    rotation: 0.7,
                },
                maxVelocity: {
                    linear: 10,
                    rotation: 1,
                },
                tolerance: {
                    position: 1,
                    rotation: 0.2,
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
                    linear: 5,
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
        if (this.actionPlan === null) {
            return LandingComputerStatusBit.IDLE;
        }

        const currentAction = this.actionPlan.at(this.currentActionIndex);
        if (currentAction === undefined) {
            return this.completeStatus;
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
                const completeStatus = this.completeStatus;
                this.setTarget(null);
                return completeStatus;
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
            this.tmpForce,
            {
                max: {
                    closingSpeed: currentAction.maxVelocity.linear,
                    acceleration: 2 * EarthG,
                },
            },
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
            this.tmpTorque,
        );

        this.aggregate.body.applyTorque(attitudeTorque);

        if (this.elapsedSeconds > this.maxSecondsPerPlan) {
            this.setTarget(null);
            return LandingComputerStatusBit.TIMEOUT;
        }

        return LandingComputerStatusBit.PROGRESS;
    }
}
