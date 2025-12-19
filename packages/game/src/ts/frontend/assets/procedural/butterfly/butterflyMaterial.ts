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

import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import type { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";

import {
    add,
    cos,
    discardTest,
    f,
    fract,
    getInstanceData,
    hash11,
    hslToRgb,
    instanceAttribute,
    mul,
    outputFragColor,
    outputVertexPosition,
    remap,
    rgbToHsl,
    rotateAround,
    sign,
    sin,
    splitVec,
    textureSample,
    transformPosition,
    uniformElapsedSeconds,
    uniformTexture2d,
    uniformViewProjection,
    uniformWorld,
    vec,
    vec3,
    vertexAttribute,
} from "@/frontend/helpers/bsl";

export class ButterflyMaterial {
    private readonly material: NodeMaterial;

    constructor(butterflyTexture: Texture, scene: Scene) {
        this.material = new NodeMaterial("ButterflyMaterial", scene);
        this.material.backFaceCulling = false;

        const position = vertexAttribute("position");
        const uv = vertexAttribute("uv");

        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");

        const elapsedSeconds = uniformElapsedSeconds();

        const globalWorld = uniformWorld();
        const { instanceID, output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const hash = mul(hash11(instanceID), f(10000));

        const scaling = remap(hash11(instanceID), f(0), f(1), f(0.02), f(0.1));

        const scaledPosition = mul(position, scaling);

        const phase = mul(hash, f(2 * Math.PI));
        const wingFlapJitter = sin(add(mul(f(5), elapsedSeconds), phase));

        const movementY = add(sin(add(mul(f(0.2), elapsedSeconds), phase)), f(3));

        const flappingPeriod = 0.5;
        const wingAngle = cos(add(mul(f((2 * Math.PI) / flappingPeriod), elapsedSeconds), phase));

        const splitPosition = splitVec(position);
        const butterflyForward = vec(new Vector3(1, 0, 0));

        const signedWingAngle = mul(sign(splitPosition.z), wingAngle);
        const flappingPosition = rotateAround(scaledPosition, butterflyForward, signedWingAngle);

        const totalMovementY = add(mul(f(0.3), movementY), mul(f(0.02), wingFlapJitter));

        const splitFlappingPosition = splitVec(flappingPosition);

        const position2 = vec3(
            splitFlappingPosition.x,
            add(splitFlappingPosition.y, totalMovementY),
            splitFlappingPosition.z,
        );

        const positionW = transformPosition(instanceWorld, position2);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const albedoTexture = uniformTexture2d(butterflyTexture).source;
        const albedo = textureSample(albedoTexture, uv);

        discardTest(albedo.a, f(0.1));

        const albedoHsl = rgbToHsl(albedo.rgb);
        const splitAlbedoHsl = splitVec(albedoHsl);
        const hueShift = hash;
        const shiftedHue = fract(add(splitAlbedoHsl.x, hueShift));
        const shiftedAlbedoHsl = vec3(shiftedHue, splitAlbedoHsl.y, splitAlbedoHsl.z);
        const shiftedAlbedo = hslToRgb(shiftedAlbedoHsl);

        const fragOutput = outputFragColor(shiftedAlbedo, { alpha: albedo.a });

        this.material.addOutputNode(vertexOutput);
        this.material.addOutputNode(fragOutput);
        this.material.build();
    }

    get() {
        return this.material;
    }

    dispose() {
        this.material.dispose();
    }
}
