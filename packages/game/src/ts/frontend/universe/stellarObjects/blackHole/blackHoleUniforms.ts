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

import { type Effect } from "@babylonjs/core/Materials/effect";
import { type CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { getKerrMetricA, getSchwarzschildRadius } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { type BlackHoleModel } from "@cosmos-journeyer/universe-model";

export const BlackHoleUniformNames = {
    STARFIELD_ROTATION: "starfieldRotation",
    ELAPSED_SECONDS: "elapsedSeconds",
    SCHWARZSCHILD_RADIUS: "schwarzschildRadius",
    FRAME_DRAGGING_FACTOR: "frameDraggingFactor",
    ACCRETION_DISK_RADIUS: "accretionDiskRadius",
    WARPING_MINKOWSKI_FACTOR: "warpingMinkowskiFactor",
    ROTATION_PERIOD: "rotationPeriod",
    WORLD_POSITION: "worldPosition",
    ROTATION: "rotation",
    INVERSE_ROTATION: "inverseRotation",
};

export const BlackHoleSamplerNames = {
    STARFIELD_TEXTURE: "starfieldTexture",
};

export class BlackHoleUniforms {
    accretionDiskRadius: number;
    rotationPeriod: number;
    warpingMinkowskiFactor: number;
    schwarzschildRadius: number;
    frameDraggingFactor: number;
    elapsedSeconds = 0;
    backgroundTexture: CubeTexture;

    private readonly worldPosition = new Vector3();
    private readonly rotation = new Matrix();
    private readonly inverseRotation = new Matrix();

    constructor(blackHoleModel: DeepReadonly<BlackHoleModel>, backgroundTexture: CubeTexture) {
        this.accretionDiskRadius = blackHoleModel.accretionDiskRadius;
        this.rotationPeriod = 1.5;
        this.warpingMinkowskiFactor = 2.0;
        this.schwarzschildRadius = getSchwarzschildRadius(blackHoleModel.mass);
        const kerrMetricA = getKerrMetricA(blackHoleModel.mass, blackHoleModel.rotation.siderealPeriod);
        this.frameDraggingFactor = kerrMetricA / blackHoleModel.mass;
        this.backgroundTexture = backgroundTexture;
    }

    public setUniforms(effect: Effect, blackHoleTransform: TransformNode, floatingOriginOffset: Vector3) {
        effect.setMatrix(BlackHoleUniformNames.STARFIELD_ROTATION, this.backgroundTexture.getReflectionTextureMatrix());
        effect.setFloat(BlackHoleUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);
        effect.setFloat(BlackHoleUniformNames.SCHWARZSCHILD_RADIUS, this.schwarzschildRadius);
        effect.setFloat(BlackHoleUniformNames.FRAME_DRAGGING_FACTOR, this.frameDraggingFactor);
        effect.setFloat(BlackHoleUniformNames.ACCRETION_DISK_RADIUS, this.accretionDiskRadius);
        effect.setFloat(BlackHoleUniformNames.WARPING_MINKOWSKI_FACTOR, this.warpingMinkowskiFactor);
        effect.setFloat(BlackHoleUniformNames.ROTATION_PERIOD, this.rotationPeriod);

        blackHoleTransform.getWorldMatrix().getRotationMatrixToRef(this.rotation);
        this.rotation.transposeToRef(this.inverseRotation);
        blackHoleTransform.getAbsolutePosition().subtractToRef(floatingOriginOffset, this.worldPosition);

        effect.setVector3(BlackHoleUniformNames.WORLD_POSITION, this.worldPosition);
        effect.setMatrix(BlackHoleUniformNames.ROTATION, this.rotation);
        effect.setMatrix(BlackHoleUniformNames.INVERSE_ROTATION, this.inverseRotation);
    }

    public setSamplers(effect: Effect) {
        effect.setTexture(BlackHoleSamplerNames.STARFIELD_TEXTURE, this.backgroundTexture);
    }
}
