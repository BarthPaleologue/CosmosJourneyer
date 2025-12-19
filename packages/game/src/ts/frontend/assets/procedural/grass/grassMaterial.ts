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
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";

import {
    add,
    cos,
    distance,
    f,
    getInstanceData,
    hash11,
    instanceAttribute,
    mix,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    pow,
    remap,
    rotateAround,
    sampleGradient,
    sin,
    smoothstep,
    splitMatrix,
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
    vec3,
    vertexAttribute,
    xz,
} from "@/frontend/helpers/bsl";

export class GrassMaterial {
    private readonly material: NodeMaterial;

    constructor(noise: Texture, scene: Scene, options?: Partial<{ fadeDistance: number }>) {
        this.material = new NodeMaterial("GrassMaterial", scene);
        this.material.backFaceCulling = false;

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");

        const elapsedSeconds = uniformElapsedSeconds();

        const globalWorld = uniformWorld();
        const { instanceID, output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const hash = hash11(instanceID);

        const noiseTexture = uniformTexture2d(noise).source;

        const height01 = splitVec(position).y;

        const instancePosition = splitMatrix(instanceWorld).row3;

        const windStrength = textureSample(
            noiseTexture,
            add(mul(f(0.05), xz(instancePosition)), mul(f(0.2), elapsedSeconds)),
        ).r;
        const windDir = mul(
            f(2.0 * Math.PI),
            textureSample(noiseTexture, add(mul(f(0.01), xz(instancePosition)), mul(f(0.01), elapsedSeconds))).r,
        );

        const windCurveAmount = remap(windStrength, f(0), f(1), f(-0.25), f(1));

        const leanAxis = vec3(cos(windDir), f(0.0), sin(windDir));

        const maxCurveAngle = f(0.6);

        const perBladeCurve = mul(hash, height01);

        const curveAmount = add(mul(perBladeCurve, maxCurveAngle), pow(windCurveAmount, f(2)));

        const curvedNormal = rotateAround(normal, leanAxis, curveAmount);
        const curvedPosition = rotateAround(position, leanAxis, curveAmount);

        const scalingTextureValue = textureSample(noiseTexture, mul(f(0.05), xz(instancePosition))).r;
        const scalingFactor = remap(scalingTextureValue, f(0), f(1), f(0.1), f(0.7));

        const cameraPosition = uniformCameraPosition();

        const bladeCameraDistance = distance(splitVec(instancePosition).xyzOut, cameraPosition);
        const fadeDistance = add(f(options?.fadeDistance ?? 60.0), mul(hash, f(10.0)));
        const fadeStartDistance = sub(fadeDistance, f(10.0));
        const fadeInFactor = sub(f(1.0), smoothstep(fadeStartDistance, fadeDistance, bladeCameraDistance));

        const finalScalingFactor = mul(scalingFactor, fadeInFactor);

        const scaledCurvedPosition = mul(curvedPosition, finalScalingFactor);

        const positionW = transformPosition(instanceWorld, scaledCurvedPosition);
        const normalW = transformDirection(instanceWorld, curvedNormal);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        const view = uniformView();

        const baseColor = Color3.FromHexString("#0C4909");
        const tipColor = Color3.FromHexString("#347215");

        const albedoRgb = sampleGradient(
            [
                [0, baseColor],
                [0.5, tipColor],
            ],
            height01,
        );

        const ambientOcclusion = mix(f(0.7), f(1.0), pow(height01, f(2.0)));

        const pbrShading = pbr(f(0.0), f(0.4), normalW, view, cameraPosition, positionW, {
            albedoRgb,
            ambientOcclusion,
        });

        const fragOutput = outputFragColor(pbrShading.lighting);

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
