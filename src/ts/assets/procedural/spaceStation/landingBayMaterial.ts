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

import { Scene } from "@babylonjs/core/scene";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { NodeMaterialModes } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialModes";
import { OrbitalFacilityModel } from "../../../architecture/orbitalObjectModel";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Settings } from "../../../settings";
import { Textures } from "../../textures";
import {
    abs,
    atan2,
    f,
    mix,
    mul,
    outputVertexPosition,
    split,
    step,
    sub,
    Target,
    transformDirection,
    transformPosition,
    uniformViewProjection,
    uniformWorld,
    vec2,
    vertexAttribute,
    xz,
    length,
    remap,
    textureSample,
    perturbNormal,
    pbrMetallicRoughnessMaterial,
    uniformView,
    uniformCameraPosition,
    outputFragColor,
    fract
} from "../../../utils/bsl";

export class LandingBayMaterial extends NodeMaterial {
    constructor(
        stationModel: OrbitalFacilityModel,
        meanRadius: number,
        deltaRadius: number,
        height: number,
        scene: Scene
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
                height: textureResolution
            },
            scene,
            true
        );

        const font_size = 128;

        //Add text to dynamic texture
        namePlateTexture.drawText(
            stationModel.name,
            null,
            null,
            `${font_size}px ${Settings.MAIN_FONT}`,
            "white",
            null,
            true,
            true
        );

        this.onDisposeObservable.addOnce(() => {
            namePlateTexture.dispose();
        });

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");
        const uv = vertexAttribute("uv");

        const positionXZ = xz(position);
        const splitPositionXZ = split(positionXZ);

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        // float mask = 1.0 - step(0.02, abs(normal.y));
        // vUV.y *= mix(1.0, height, mask);
        const mask = sub(f(1), step(f(0.02), abs(split(normal).y)));
        const scaledUvY = mul(split(uv).y, mix(f(1.0), f(height), mask));

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
            f(1.0)
        );

        const proceduralUvX = mul(theta, f(meanRadius / deltaRadius));
        const proceduralUV = vec2(proceduralUvX, scaledUvY);

        const albedo = textureSample(Textures.SPACE_STATION_ALBEDO, proceduralUV, {
            convertToLinearSpace: true
        });
        const normalMap = textureSample(Textures.SPACE_STATION_NORMAL, proceduralUV);
        const metallic = textureSample(Textures.SPACE_STATION_METALLIC, proceduralUV);
        const roughness = textureSample(Textures.SPACE_STATION_ROUGHNESS, proceduralUV);
        const occlusion = textureSample(Textures.SPACE_STATION_AMBIENT_OCCLUSION, proceduralUV);

        const namePlateUvX = mul(theta, f(1.0 / Math.PI));
        const namePlateUvY = distanceToCenter01;

        /* if (vNormal.y < 1.0) {
            namePlateUV *= 0.0;
        } */
        const namePlateUvMask = step(f(1.0), split(normal).y);
        const namePlateUV = mix(vec2(f(0.0), f(0.0)), vec2(namePlateUvX, namePlateUvY), namePlateUvMask);

        const namePlateColor = textureSample(namePlateTexture, fract(namePlateUV));
        const paintWeight = namePlateColor.a;

        const finalAlbedo = mix(albedo.rgb, namePlateColor.rgb, paintWeight);
        const finalMetallic = mix(metallic.r, f(0.0), paintWeight);
        const finalRoughness = mix(roughness.r, f(0.7), paintWeight);
        const finalAo = mix(occlusion.r, f(1.0), paintWeight);

        const perturbedNormal = perturbNormal(
            proceduralUV,
            positionW,
            normalW,
            normalMap.rgb,
            sub(f(1), mul(paintWeight, f(0.7)))
        );

        const view = uniformView();
        const cameraPosition = uniformCameraPosition();

        const pbrColor = pbrMetallicRoughnessMaterial(
            finalAlbedo,
            finalMetallic,
            finalRoughness,
            finalAo,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW
        );

        const fragOutput = outputFragColor(pbrColor);

        this.addOutputNode(fragOutput);

        this.build();
    }
}
