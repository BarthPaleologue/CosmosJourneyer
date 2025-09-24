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
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { type BlackHoleModel } from "@/backend/universe/orbitalObjects/stellarObjects/blackHoleModel";

import { getKerrMetricA } from "@/utils/physics/blackHole";
import { type DeepReadonly } from "@/utils/types";

export const BlackHoleUniformNames = {
    STARFIELD_ROTATION: "starfieldRotation",
    TIME: "time",
    SCHWARZSCHILD_RADIUS: "schwarzschildRadius",
    FRAME_DRAGGING_FACTOR: "frameDraggingFactor",
    ACCRETION_DISK_RADIUS: "accretionDiskRadius",
    WARPING_MINKOWSKI_FACTOR: "warpingMinkowskiFactor",
    ROTATION_PERIOD: "rotationPeriod",
    ROTATION_AXIS: "rotationAxis",
    FORWARD_AXIS: "forwardAxis",
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
    time = 0;
    backgroundTexture: CubeTexture;

    constructor(blackHoleModel: DeepReadonly<BlackHoleModel>, backgroundTexture: CubeTexture) {
        this.accretionDiskRadius = blackHoleModel.accretionDiskRadius;
        this.rotationPeriod = 1.5;
        this.warpingMinkowskiFactor = 2.0;
        this.schwarzschildRadius = blackHoleModel.radius;
        const kerrMetricA = getKerrMetricA(blackHoleModel.mass, blackHoleModel.siderealDaySeconds);
        this.frameDraggingFactor = kerrMetricA / blackHoleModel.mass;
        this.backgroundTexture = backgroundTexture;
    }

    public setUniforms(effect: Effect, blackHoleTransform: TransformNode) {
        effect.setMatrix(BlackHoleUniformNames.STARFIELD_ROTATION, this.backgroundTexture.getReflectionTextureMatrix());
        effect.setFloat(BlackHoleUniformNames.TIME, this.time);
        effect.setFloat(BlackHoleUniformNames.SCHWARZSCHILD_RADIUS, this.schwarzschildRadius);
        effect.setFloat(BlackHoleUniformNames.FRAME_DRAGGING_FACTOR, this.frameDraggingFactor);
        effect.setFloat(BlackHoleUniformNames.ACCRETION_DISK_RADIUS, this.accretionDiskRadius);
        effect.setFloat(BlackHoleUniformNames.WARPING_MINKOWSKI_FACTOR, this.warpingMinkowskiFactor);
        effect.setFloat(BlackHoleUniformNames.ROTATION_PERIOD, this.rotationPeriod);
        effect.setVector3(BlackHoleUniformNames.ROTATION_AXIS, blackHoleTransform.up);
        effect.setVector3(BlackHoleUniformNames.FORWARD_AXIS, blackHoleTransform.forward);
    }

    public setSamplers(effect: Effect) {
        effect.setTexture(BlackHoleSamplerNames.STARFIELD_TEXTURE, this.backgroundTexture);
    }
}
