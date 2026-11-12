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

import { Constants } from "@babylonjs/core/Engines/constants";
import { Material } from "@babylonjs/core/Materials/material";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import {
    add,
    builtinAttribute,
    cos,
    getInstanceData,
    hash11,
    mul,
    oneMinus,
    outputFragColor,
    outputVertexPosition,
    pow,
    sin,
    smoothstep,
    splitVec,
    transformPosition,
    uniformElapsedSeconds,
    uniformViewProjection,
    uniformWorld,
    vec3,
} from "babylonjs-shading-language";

import { sineWave } from "@/utils/bslExtensions";

/**
 * @param scene - Scene owning the material.
 * @returns Animated aurora material for geometry expressed in meters.
 */
export function createAuroraMaterial(scene: Scene): Material {
    const material = new NodeMaterial("PlainColorMaterial", scene);

    const position = builtinAttribute("position");

    const globalWorld = uniformWorld();

    const world0 = builtinAttribute("world0");
    const world1 = builtinAttribute("world1");
    const world2 = builtinAttribute("world2");
    const world3 = builtinAttribute("world3");
    const { instanceID, output: instanceWorld } = getInstanceData(world0, world1, world2, world3, globalWorld);

    const { x, y } = splitVec(position);

    const elapsedSeconds = uniformElapsedSeconds();

    const ribbonLength = 500e3;
    const ribbonHeight = 50e3;

    const animatedX = mul(x, ribbonLength);
    const ribbonYOffset = mul(hash11(instanceID), 60e3);
    const newY = add(mul(y, ribbonHeight), ribbonYOffset);

    let animatedZ = sineWave(x, 10.0, mul(elapsedSeconds, 2.0));
    animatedZ = mul(animatedZ, 20e3);

    const animatedPosition = vec3({ x: animatedX, y: newY, z: animatedZ });

    const viewProjection = uniformViewProjection();

    const positionWorld = transformPosition(instanceWorld, animatedPosition);
    const positionClip = transformPosition(viewProjection, positionWorld);

    const fragmentColor = new Color3(0, 0.4, 0);

    let fragmentAlpha = mul(oneMinus(y), add(1.0, mul(pow(cos(mul(x, 100)), 2.0), 0.3)));

    // fade bottom
    fragmentAlpha = mul(fragmentAlpha, smoothstep(0.0, 0.3, y));

    fragmentAlpha = mul(fragmentAlpha, smoothstep(-0.5, -0.4, x));

    fragmentAlpha = mul(fragmentAlpha, oneMinus(smoothstep(0.4, 0.5, x)));

    fragmentAlpha = pow(fragmentAlpha, 2.0);

    material.addOutputNode(outputVertexPosition(positionClip));
    material.addOutputNode(outputFragColor(fragmentColor, { alpha: fragmentAlpha }));

    material.build();

    material.fillMode = Material.TriangleStripDrawMode;
    material.backFaceCulling = false;
    material.alphaMode = Constants.ALPHA_ADD;

    return material;
}
