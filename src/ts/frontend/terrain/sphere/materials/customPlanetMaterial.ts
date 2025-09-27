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
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { type Scene } from "@babylonjs/core/scene";

import {
    distance,
    f,
    normalize,
    outputFragColor,
    outputVertexPosition,
    pbrMetallicRoughnessMaterial,
    perturbNormal,
    smoothstep,
    split,
    Target,
    transformDirection,
    transformPosition,
    uniformCameraPosition,
    uniformMat4,
    uniformView,
    uniformViewProjection,
    uniformWorld,
    vertexAttribute,
} from "@/utils/bsl";
import { bslTextureSample2d, unitSphereToUv, type BslTexture2dUv } from "@/utils/bslExtensions";

const UniformNames = {
    InversePlanetWorld: "inversePlanetWorld",
} as const;

export class CustomPlanetMaterial {
    private readonly material: NodeMaterial;

    constructor(albedoTexture: BslTexture2dUv, normalTexture: BslTexture2dUv, scene: Scene) {
        this.material = new NodeMaterial("CustomPlanetMaterial", scene);

        const position = vertexAttribute("position");
        const normal = vertexAttribute("normal");

        const world = uniformWorld();
        const positionW = transformPosition(world, position);
        const normalW = transformDirection(world, normal);

        const inversePlanetWorld = uniformMat4(UniformNames.InversePlanetWorld, Matrix.Identity());

        const positionPlanetSpace = transformPosition(inversePlanetWorld, positionW);

        const viewProjection = uniformViewProjection();
        const positionClipSpace = transformPosition(viewProjection, positionW);

        const vertexOutput = outputVertexPosition(positionClipSpace);

        this.material.addOutputNode(vertexOutput);

        const uv = unitSphereToUv(normalize(positionPlanetSpace, { target: Target.FRAG }));

        const albedo = bslTextureSample2d(albedoTexture, uv, {
            convertToLinearSpace: true,
        });
        const normalMap = bslTextureSample2d(normalTexture, uv);

        const cameraPosition = uniformCameraPosition();

        const distanceToCamera = distance(cameraPosition, split(positionW).xyzOut);

        const normalMapStrength = smoothstep(f(100e3), f(300e3), distanceToCamera);

        const perturbedNormal = perturbNormal(uv, positionW, normalW, normalMap.rgb, normalMapStrength);

        const view = uniformView();

        const pbrColor = pbrMetallicRoughnessMaterial(
            albedo.rgb,
            f(0.0),
            f(1.0),
            null,
            perturbedNormal,
            normalW,
            view,
            cameraPosition,
            positionW,
        );

        const fragOutput = outputFragColor(pbrColor);

        this.material.addOutputNode(fragOutput);

        this.material.build();
    }

    setPlanetInverseWorld(inverseWorld: Matrix) {
        const inverseWorldBlock = this.material.getInputBlockByPredicate(
            (block) => block.name === UniformNames.InversePlanetWorld,
        );
        if (inverseWorldBlock === null) {
            console.warn(`Input block ${UniformNames.InversePlanetWorld} not found in material.`);
            return;
        }
        inverseWorldBlock.value = inverseWorld;
    }

    get() {
        return this.material;
    }

    dispose() {
        this.material.dispose();
    }
}
