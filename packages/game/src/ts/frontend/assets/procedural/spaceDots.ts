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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import { lerpSmooth } from "@/frontend/helpers/animations/interpolations";
import type { Transformable } from "@/frontend/universe/architecture/transformable";

import { SpaceDotsMaterial, type SpaceDotsMaterialOptions } from "./spaceDotsMaterial";

export type SpaceDotsOptions = SpaceDotsMaterialOptions;

const DEFAULT_INSTANCE_COUNT = 10_000;
const DEFAULT_BEND_HALF_LIFE = 0.12;
const DEFAULT_WORLD_UP = new Vector3(0, 1, 0);
const DEFAULT_WORLD_FORWARD = new Vector3(0, 0, 1);

export class SpaceDots implements Transformable {
    private readonly mesh: Mesh;
    private readonly material: SpaceDotsMaterial;

    private throttle = 0;
    private targetYawIntent = 0;
    private targetPitchIntent = 0;
    private currentYawBend = 0;
    private currentPitchBend = 0;
    private currentRollCompensation = 0;
    private readonly warpForward = new Vector3(0, 0, 1);
    private readonly warpUp = new Vector3(0, 1, 0);
    private readonly steeringUp = new Vector3(0, 1, 0);
    private readonly tmpCross = Vector3.Zero();
    private readonly tmpProjected = Vector3.Zero();
    private readonly tmpRight = Vector3.Zero();
    private readonly tmpFallback = Vector3.Zero();
    private hasWarpFrame = false;

    constructor(scene: Scene, options?: SpaceDotsOptions) {
        this.mesh = new Mesh("SpaceDotQuad", scene);
        this.mesh.alwaysSelectAsActiveMesh = true;
        this.mesh.isPickable = false;
        this.mesh.setEnabled(false);

        const positions = new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]);
        const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.applyToMesh(this.mesh);

        const instanceCount = options?.instanceCount ?? DEFAULT_INSTANCE_COUNT;
        const instanceBuffer = new VertexBuffer(
            scene.getEngine(),
            new Float32Array(instanceCount),
            "instanceDummy",
            false,
            false,
            1,
            true,
        );
        this.mesh.setVerticesBuffer(instanceBuffer);
        this.mesh.forcedInstanceCount = instanceCount;

        this.material = new SpaceDotsMaterial(scene, options);
        this.mesh.material = this.material.get();
        this.material.setWarpFrame(this.warpForward);
        this.material.setSteeringFrame(this.steeringUp);
        this.material.setRollCompensationAngle(0);
        this.material.setSteeringBend(0, 0);
    }

    public setThrottle(throttle: number): void {
        this.throttle = Math.min(Math.max(throttle, 0), 1);
        this.getTransform().setEnabled(this.throttle > 0);
        this.material.setThrottle(this.throttle);
    }

    public setSteering(yawIntent: number, pitchIntent: number): void {
        this.targetYawIntent = yawIntent;
        this.targetPitchIntent = pitchIntent;
    }

    public update(deltaSeconds: number): void {
        this.updateWarpFrame();
        this.updateSteeringBend(deltaSeconds);
        this.material.update(deltaSeconds);
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    public dispose() {
        this.material.dispose();
        this.mesh.dispose(false, true);
    }

    private updateWarpFrame(): void {
        const reference = this.mesh.parent instanceof TransformNode ? this.mesh.parent : this.mesh;
        this.warpForward.copyFrom(reference.getDirection(DEFAULT_WORLD_FORWARD)).normalize();
        this.steeringUp.copyFrom(reference.getDirection(DEFAULT_WORLD_UP)).normalize();
        this.material.setSteeringFrame(this.steeringUp);

        if (!this.hasWarpFrame) {
            this.resetWarpUp();
            this.hasWarpFrame = true;
            this.syncMaterialFrame();
            return;
        }

        projectOntoPlaneToRef(this.warpUp, this.warpForward, this.tmpProjected);
        if (this.tmpProjected.lengthSquared() < 1e-6) {
            this.resetWarpUp();
            this.syncMaterialFrame();
            return;
        }

        this.tmpProjected.normalize();
        Vector3.CrossToRef(this.tmpProjected, this.warpForward, this.tmpRight);
        if (this.tmpRight.lengthSquared() < 1e-6) {
            this.resetWarpUp();
            this.syncMaterialFrame();
            return;
        }

        this.tmpRight.normalize();
        Vector3.CrossToRef(this.warpForward, this.tmpRight, this.warpUp);
        this.warpUp.normalize();
        this.syncMaterialFrame();
    }

    private resetWarpUp(): void {
        projectOntoPlaneToRef(DEFAULT_WORLD_UP, this.warpForward, this.tmpFallback);
        if (this.tmpFallback.lengthSquared() < 1e-6) {
            projectOntoPlaneToRef(DEFAULT_WORLD_FORWARD, this.warpForward, this.tmpFallback);
        }

        this.tmpFallback.normalize();
        Vector3.CrossToRef(this.tmpFallback, this.warpForward, this.tmpRight);
        this.tmpRight.normalize();
        Vector3.CrossToRef(this.warpForward, this.tmpRight, this.warpUp);
        this.warpUp.normalize();
    }

    private updateSteeringBend(deltaSeconds: number): void {
        const targetYawBend = this.targetYawIntent;
        const targetPitchBend = this.targetPitchIntent;

        this.currentYawBend = lerpSmooth(this.currentYawBend, targetYawBend, DEFAULT_BEND_HALF_LIFE, deltaSeconds);
        this.currentPitchBend = lerpSmooth(
            this.currentPitchBend,
            targetPitchBend,
            DEFAULT_BEND_HALF_LIFE,
            deltaSeconds,
        );

        this.material.setSteeringBend(this.currentYawBend, this.currentPitchBend);
    }

    private syncMaterialFrame(): void {
        this.material.setWarpFrame(this.warpForward);
        this.currentRollCompensation = computeSignedAngleAroundAxis(
            this.steeringUp,
            this.warpUp,
            this.warpForward,
            this.tmpCross,
        );
        this.material.setRollCompensationAngle(this.currentRollCompensation);
    }
}

function projectOntoPlaneToRef(vector: Vector3, normal: Vector3, ref: Vector3): Vector3 {
    ref.copyFrom(normal).scaleInPlace(Vector3.Dot(vector, normal));
    ref.scaleInPlace(-1).addInPlace(vector);
    return ref;
}

function computeSignedAngleAroundAxis(from: Vector3, to: Vector3, axis: Vector3, tmpCross: Vector3): number {
    Vector3.CrossToRef(from, to, tmpCross);
    return Math.atan2(Vector3.Dot(axis, tmpCross), Vector3.Dot(from, to));
}
