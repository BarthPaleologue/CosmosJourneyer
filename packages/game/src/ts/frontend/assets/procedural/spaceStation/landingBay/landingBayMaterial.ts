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

import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { type Scene } from "@babylonjs/core/scene";

import { type OrbitalFacilityModel } from "@/backend/universe/orbitalObjects/index";

import { type PBRTextures } from "@/frontend/assets/textures/materials";
import {
    abs,
    atan2,
    f,
    fract,
    length,
    mix,
    mul,
    outputFragColor,
    outputVertexPosition,
    pbr,
    perturbNormal,
    remap,
    splitVec,
    step,
    sub,
    Target,
    textureSample,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vec2,
    vertexAttribute,
    xz,
} from "@/frontend/helpers/bsl";

import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

export class LandingBayMaterial extends NodeMaterial {
    constructor(
        stationModel: DeepReadonly<OrbitalFacilityModel>,
        meanRadius: number,
        deltaRadius: number,
        height: number,
        textures: PBRTextures,
        scene: Scene,
    ) {
        super("LandingBayMaterial", scene);
        this.mode = NodeMaterialModes.Material;

        const circumference = 2 * Math.PI * meanRadius;

        const aspectRatio = (0.5 * circumference) / deltaRadius;

        const textureResolution = 256;
        const namePlateTexture = new DynamicTexture(
            `NamePlateTexture`,
            {
                width: textureResolution * aspectRatio,
                height: textureResolution,
            },
            scene,
            true,
        );

        const font_size = 128;

        //Add text to dynamic texture
        namePlateTexture.drawText(
            stationModel.name.toUpperCase(),
            null,
            null,
            `${font_size}px ${Settings.MAIN_FONT}`,
            "white",
            null,
            true,
            true,
        );

        this.onDisposeObservable.addOnce(() => {
            namePlateTexture.dispose();
        });

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const positionXZ = xz(position);
        const splitPositionXZ = splitVec(positionXZ);

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        // float mask = 1.0 - step(0.02, abs(normal.y));
        // vUV.y *= mix(1.0, height, mask);
        const mask = sub(f(1), step(f(0.02), abs(splitVec(normal).y)));
        const scaledUvY = mul(splitVec(uv).y, mix(f(1.0), f(height), mask));

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        this.addOutputNode(vertexOutput);

        const theta = atan2(splitPositionXZ.y, splitPositionXZ.x, { target: Target.FRAG });
        const distanceToCenter = length(positionXZ, { target: Target.FRAG });

        const distanceToCenter01 = remap(
            distanceToCenter,
            f(meanRadius - deltaRadius / 2.0),
            f(meanRadius + deltaRadius / 2.0),
            f(0.0),
            f(1.0),
        );

        const proceduralUvX = mul(theta, f(meanRadius / deltaRadius));
        const proceduralUV = vec2(proceduralUvX, scaledUvY);

        const albedo = textureSample(textures.albedo, proceduralUV, {
            convertToLinearSpace: true,
        });
        const normalMap = textureSample(textures.normal, proceduralUV);
        const metallicRoughness = textureSample(textures.metallicRoughness, proceduralUV);
        const occlusion = textureSample(textures.ambientOcclusion, proceduralUV);

        const namePlateUvX = mul(theta, f(1.0 / Math.PI));
        const namePlateUvY = distanceToCenter01;

        /* if (vNormal.y < 1.0) {
            namePlateUV *= 0.0;
        } */
        const namePlateUvMask = step(f(1.0), splitVec(normal).y);
        const namePlateUV = mix(vec2(f(0.0), f(0.0)), vec2(namePlateUvX, namePlateUvY), namePlateUvMask);

        const namePlateColor = textureSample(namePlateTexture, fract(namePlateUV));
        const paintWeight = namePlateColor.a;

        const finalAlbedo = mix(albedo.rgb, namePlateColor.rgb, paintWeight);
        const finalMetallic = mix(metallicRoughness.r, f(0.0), paintWeight);
        const finalRoughness = mix(metallicRoughness.g, f(0.7), paintWeight);
        const finalAo = mix(occlusion.r, f(1.0), paintWeight);

        const perturbedNormal = perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalMap.rgb,
            sub(f(1), mul(paintWeight, f(0.7))),
        );

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrColor = pbr(
            finalMetallic,
            finalRoughness,
            perturbedNormal.output,
            normalW,
            view,
            cameraPosition,
            positionW,
            {
                albedoRgb: finalAlbedo,
                ambientOcclusion: finalAo,
            },
        );

        const fragOutput = outputFragColor(pbrColor.lighting);

        this.addOutputNode(fragOutput);

        this.build();
    }
}
