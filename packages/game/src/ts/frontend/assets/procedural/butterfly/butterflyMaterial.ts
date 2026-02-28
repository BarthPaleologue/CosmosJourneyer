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
    abs,
    add,
    cos,
    discardTest,
    div,
    f,
    fract,
    getInstanceData,
    hash11,
    hslToRgb,
    instanceAttribute,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    remap,
    rgbToHsl,
    rotateAround,
    sign,
    sin,
    splitVec,
    sub,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformElapsedSeconds,
    uniformTexture2d,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec,
    vec3,
    vertexAttribute,
} from "babylonjs-shading-language";

export class ButterflyMaterial {
    private readonly material: NodeMaterial;

    constructor(butterflyTexture: Texture, scene: Scene) {
        this.material = new NodeMaterial("ButterflyMaterial", scene);
        this.material.backFaceCulling = false;

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");

        const elapsedSeconds = uniformElapsedSeconds();

        const globalWorld = uniformWorld();
        const { instanceID, output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const hash = hash11(instanceID);

        const scaling = remap(hash, f(0), f(1), f(0.02), f(0.1));

        const scaledPosition = mul(position, scaling);

        const flappingPeriod = remap(hash, f(0), f(1), f(0.25), f(0.75));
        const flappingOmega = div(f(2 * Math.PI), flappingPeriod);
        const phase = mul(hash, f(2 * Math.PI));
        const wingFlapJitter = sin(add(mul(flappingOmega, elapsedSeconds), phase));

        const movementY = add(sin(add(mul(f(0.2), elapsedSeconds), phase)), f(3));

        const wingAngleShape = abs(cos(add(mul(flappingOmega, elapsedSeconds), phase)));
        const wingAngle = remap(sub(f(1), wingAngleShape), f(0), f(1), f(-0.7), f(1));

        const splitPosition = splitVec(position);
        const butterflyForward = vec(new Vector3(1, 0, 0));

        const signedWingAngle = mul(sign(splitPosition.z), wingAngle);
        const flappingPosition = rotateAround(scaledPosition, butterflyForward, signedWingAngle);

        const flappingNormal = rotateAround(normal, butterflyForward, signedWingAngle);

        const totalMovementY = add(mul(f(0.3), movementY), mul(mul(scaling, f(0.2)), wingFlapJitter));

        const splitFlappingPosition = splitVec(flappingPosition);

        const position2 = vec3(
            splitFlappingPosition.x,
            add(splitFlappingPosition.y, totalMovementY),
            splitFlappingPosition.z,
        );

        const rotationAngle = cos(elapsedSeconds);

        const position3 = rotateAround(position2, vec(Vector3.Up()), rotationAngle);

        const finalNormal = rotateAround(flappingNormal, vec(Vector3.Up()), rotationAngle);

        const positionW = transformPosition(instanceWorld, position3);
        const normalW = transformDirection(instanceWorld, finalNormal);

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

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();
        const shading = pbr(f(0), f(1), normalW, view, cameraPosition, positionW, { albedoRgb: shiftedAlbedo });

        const ambient = mul(f(0.8), shiftedAlbedo);

        const fragOutput = outputFragColor(add(ambient, shading.lighting), { alpha: albedo.a });

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
