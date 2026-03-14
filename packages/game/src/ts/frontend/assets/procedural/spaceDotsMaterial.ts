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

import type { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import {
    add,
    color,
    cross,
    f,
    getInstanceData,
    hash11,
    instanceAttribute,
    mod,
    mul,
    normalize,
    outputFragColor,
    outputVertexPosition,
    remap,
    splitMatrix,
    splitVec,
    sub,
    swizzle,
    transformPosition,
    uniformCameraPosition,
    uniformFloat,
    uniformViewProjection,
    uniformWorld,
    vec3,
    vertexAttribute,
} from "babylonjs-shading-language";

import { lerp } from "@/frontend/helpers/animations/interpolations";

import { addN, sampleDisk } from "@/utils/bslExtensions";

export type SpaceDotsMaterialOptions = Partial<{
    instanceCount: number;
    tunnelLength: number;
    minRadius: number;
    maxRadius: number;
    minSpeed: number;
    maxSpeed: number;
    width: number;
    minStretch: number;
    maxStretch: number;
}>;

const DEFAULT_TUNNEL_LENGTH = 300;
const DEFAULT_MIN_RADIUS = 12;
const DEFAULT_MAX_RADIUS = 36;
const DEFAULT_WIDTH = 0.05;
const DEFAULT_MIN_STRETCH = 0.125;
const DEFAULT_MAX_STRETCH = 2.5;

export class SpaceDotsMaterial {
    private readonly material: NodeMaterial;
    private readonly uTranslationOffset: InputBlock;
    private readonly uThrottle: InputBlock;

    private translationOffset = 0;
    private throttle = 0;
    private readonly minSpeed: number;
    private readonly maxSpeed: number;

    constructor(scene: Scene, options?: SpaceDotsMaterialOptions) {
        this.minSpeed = options?.minSpeed ?? 15;
        this.maxSpeed = options?.maxSpeed ?? 120;

        this.material = new NodeMaterial("SpaceDotsMaterial", scene);
        this.material.backFaceCulling = false;

        this.uTranslationOffset = uniformFloat("uTranslationOffset", { defaultValue: 0 });
        this.uThrottle = uniformFloat("uThrottle", { defaultValue: 0 });

        const position = vertexAttribute("position");
        const world0 = instanceAttribute("world0");
        const world1 = instanceAttribute("world1");
        const world2 = instanceAttribute("world2");
        const world3 = instanceAttribute("world3");
        const globalWorld = uniformWorld();
        const { instanceID } = getInstanceData(world0, world1, world2, world3, globalWorld);

        const translationOffset = this.uTranslationOffset.output;
        const throttle = this.uThrottle.output;
        const minRadius = options?.minRadius ?? DEFAULT_MIN_RADIUS;
        const maxRadius = options?.maxRadius ?? DEFAULT_MAX_RADIUS;

        const diskSample = sampleDisk(instanceID, { minRadius, maxRadius });
        const phaseHash = hash11(add(instanceID, f(47)));
        const tunnelLength = options?.tunnelLength ?? DEFAULT_TUNNEL_LENGTH;
        const initialPhase = mul(phaseHash, f(tunnelLength));
        const translationPhase = mod(add(initialPhase, translationOffset), f(tunnelLength));
        const translation = sub(translationPhase, f(tunnelLength / 2));

        const instanceCenter = vec3({
            x: diskSample.x,
            y: diskSample.y,
            z: translation,
        });
        const instanceCenterW = swizzle(transformPosition(globalWorld, instanceCenter), "xyz");

        const width = f(options?.width ?? DEFAULT_WIDTH);
        const stretch = remap(
            throttle,
            [0, 1],
            [options?.minStretch ?? DEFAULT_MIN_STRETCH, options?.maxStretch ?? DEFAULT_MAX_STRETCH],
        );

        const splitPosition = splitVec(position);
        const widthOffset = mul(splitPosition.x, width);
        const forwardOffset = mul(splitPosition.y, stretch);

        const splitGlobalWorld = splitMatrix(globalWorld);
        const worldForward = normalize(swizzle(splitGlobalWorld.row2, "xyz"));
        const cameraPosition = uniformCameraPosition();
        const toCamera = normalize(sub(cameraPosition, instanceCenterW));
        const billboardRight = normalize(cross(worldForward, toCamera));

        const rightOffset = mul(billboardRight, widthOffset);
        const forwardWorldOffset = mul(worldForward, forwardOffset);
        const vertexPositionWorld = addN([instanceCenterW, rightOffset, forwardWorldOffset]);

        const viewProjection = uniformViewProjection();
        const vertexPositionClip = transformPosition(viewProjection, vertexPositionWorld);

        const outputColor = color(Color3.White());

        this.material.addOutputNode(outputVertexPosition(vertexPositionClip));
        this.material.addOutputNode(outputFragColor(outputColor, { glow: outputColor }));
        this.material.build();
    }

    public get(): NodeMaterial {
        return this.material;
    }

    public update(deltaSeconds: number): void {
        const speed = lerp(this.minSpeed, this.maxSpeed, this.throttle);
        this.translationOffset += deltaSeconds * speed;
        this.uTranslationOffset.value = this.translationOffset;
    }

    public setThrottle(throttle: number) {
        this.throttle = throttle;
        this.uThrottle.value = throttle;
    }

    public dispose() {
        this.material.dispose();
    }
}
