//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { LandingPad } from "../landingPad/landingPad";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { Observable } from "@babylonjs/core/Misc/observable";
import { CollisionMask } from "../settings";
import { getUpwardDirection, rotate, translate } from "../uberCore/transforms/basicTransform";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";

const enum LandingState {
    FLYING,
    GOING_ABOVE_TARGET,
    LANDING,
    LANDED,
}

const enum LandingTarget {
    NONE,
    SURFACE,
    PAD
}

/**
 * This component handles landing on pads and planet surfaces for spaceships.
 */
export class LandingComputer {
    private state = LandingState.FLYING;
    private targetType = LandingTarget.NONE;

    private targetObjectTransform: TransformNode | null = null;

    private padTarget: LandingPad | null = null;

    private readonly shipPhysicsBody;

    readonly onLandingCompleteObservable = new Observable<void>();

    private readonly raycastResult = new PhysicsRaycastResult();
    private readonly physicsEngine: PhysicsEngineV2;

    constructor(shipPhysicsBody: PhysicsBody) {
        this.shipPhysicsBody = shipPhysicsBody;

        const physicsEngine = this.shipPhysicsBody.transformNode.getScene().getPhysicsEngine();
        if(physicsEngine === null) throw new Error("Physics engine is null!");

        this.physicsEngine = physicsEngine as PhysicsEngineV2;
    }

    public landOnPad(pad: LandingPad) {
        console.log(this.shipPhysicsBody.transformNode.name, "starts landing on pad", pad.getTransform().name);
        this.padTarget = pad;
        this.targetType = LandingTarget.PAD;
        this.state = LandingState.GOING_ABOVE_TARGET;
    }

    public landOnSurface(objectTransform: TransformNode) {
        this.targetObjectTransform = objectTransform;
        this.targetType = LandingTarget.SURFACE;
        this.state = LandingState.GOING_ABOVE_TARGET;
    }

    public takeOff() {
        this.targetType = LandingTarget.NONE;
        this.state = LandingState.FLYING;
    }

    private finishLanding() {
        this.state = LandingState.LANDED;
        this.targetType = LandingTarget.NONE;
        this.padTarget = null;
        this.targetObjectTransform = null;
        this.onLandingCompleteObservable.notifyObservers();
    }

    private updateLandingOnPad(deltaSeconds: number) {
        const landingPad = this.padTarget;
        if(landingPad === null) throw new Error("Landing on pad, but pad is null!");

        const shipTransform = this.shipPhysicsBody.transformNode;
        const shipPosition = shipTransform.getAbsolutePosition();

        const padUp = getUpwardDirection(landingPad.getTransform());

        const targetPosition = landingPad.getTransform().getAbsolutePosition();
        targetPosition.addInPlace(padUp.scale(2));
        const currentPosition = shipPosition;

        const distance = Vector3.Distance(targetPosition, currentPosition);

        if (distance < 0.01) {
            this.finishLanding();
            return;
        }

        const shipUp = getUpwardDirection(shipTransform);

        const rotationAxis = Vector3.Cross(shipUp, padUp);
        const rotationAngle = Math.acos(Vector3.Dot(shipUp, padUp));

        this.shipPhysicsBody.applyAngularImpulse(rotationAxis.scale(rotationAngle));

        // dampen rotation that is not along the rotation axis
        const angularVelocity = this.shipPhysicsBody.getAngularVelocity();
        const noiseAngularVelocity = angularVelocity.subtract(rotationAxis.scale(Vector3.Dot(angularVelocity, rotationAxis)));
        this.shipPhysicsBody.applyAngularImpulse(noiseAngularVelocity.scale(-0.1));

        translate(
            shipTransform,
            targetPosition
                .subtract(currentPosition)
                .normalize()
                .scaleInPlace(Math.min(distance, 20 * deltaSeconds))
        );
    }

    private updateLandingOnSurface(deltaSeconds: number) {
        if(this.targetObjectTransform === null) throw new Error("Landing on surface, but object transform is null!");
        const shipTransform = this.shipPhysicsBody.transformNode;
        const shipPosition = shipTransform.getAbsolutePosition();
        const gravityDir = this.targetObjectTransform.getAbsolutePosition().subtract(shipPosition).normalize();
        const start = shipPosition.add(gravityDir.scale(-50e3));
        const end = shipPosition.add(gravityDir.scale(50e3));

        this.physicsEngine.raycastToRef(start, end, this.raycastResult, { collideWith: CollisionMask.ENVIRONMENT });
        if (this.raycastResult.hasHit) {
            const landingSpotNormal = this.raycastResult.hitNormalWorld;

            const landingSpot = this.raycastResult.hitPointWorld.add(this.raycastResult.hitNormalWorld.scale(1.0));

            const distance = landingSpot.subtract(shipPosition).dot(gravityDir);
            translate(shipTransform, gravityDir.scale(Math.min(10 * deltaSeconds * Math.sign(distance), distance)));

            const currentUp = getUpwardDirection(shipTransform);
            const targetUp = landingSpotNormal;
            let theta = 0.0;
            if (Vector3.Distance(currentUp, targetUp) > 0.01) {
                const axis = Vector3.Cross(currentUp, targetUp);
                theta = Math.acos(Vector3.Dot(currentUp, targetUp));
                rotate(shipTransform, axis, Math.min(0.4 * deltaSeconds, theta));
            }

            if (Math.abs(distance) < 0.3 && Math.abs(theta) < 0.01) {
                this.finishLanding();
            }
        }
    }

    public update(deltaSeconds: number) {
        switch (this.targetType) {
            case LandingTarget.NONE:
                break;
            case LandingTarget.SURFACE:
                this.updateLandingOnSurface(deltaSeconds);
                break;
            case LandingTarget.PAD:
                this.updateLandingOnPad(deltaSeconds);
                break;
        }
    }

    public dispose() {
        this.onLandingCompleteObservable.clear();
    }
}