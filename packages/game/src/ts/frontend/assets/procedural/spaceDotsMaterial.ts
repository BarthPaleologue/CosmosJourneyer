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

import { InputBlock } from "@babylonjs/core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockTargets } from "@babylonjs/core/Materials/Node/Enums/nodeMaterialBlockTargets";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import {
    abs,
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
    sin,
    cos,
    splitMatrix,
    splitVec,
    sub,
    swizzle,
    transformPosition,
    uniformCameraPosition,
    uniformFloat,
    uniformViewProjection,
    uniformWorld,
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

const DEFAULT_TUNNEL_LENGTH = 500;
const DEFAULT_MIN_RADIUS = 12;
const DEFAULT_MAX_RADIUS = 36;
const DEFAULT_WIDTH = 0.05;
const DEFAULT_MIN_STRETCH = 0.125;
const DEFAULT_MAX_STRETCH = 5;
const DEFAULT_MAX_BEND = 42;

export class SpaceDotsMaterial {
    private readonly material: NodeMaterial;
    private readonly uTranslationOffset: InputBlock;
    private readonly uThrottle: InputBlock;
    private readonly uWarpForward: InputBlock;
    private readonly uSteeringUp: InputBlock;
    private readonly uRollCompensationAngle: InputBlock;
    private readonly uBendYaw: InputBlock;
    private readonly uBendPitch: InputBlock;

    private translationOffset = 0;
    private throttle = 0;
    private readonly minSpeed: number;
    private readonly maxSpeed: number;
    private readonly tunnelLength: number;

    constructor(scene: Scene, options?: SpaceDotsMaterialOptions) {
        this.minSpeed = options?.minSpeed ?? 15;
        this.maxSpeed = options?.maxSpeed ?? 120;
        this.tunnelLength = options?.tunnelLength ?? DEFAULT_TUNNEL_LENGTH;

        this.material = new NodeMaterial("SpaceDotsMaterial", scene);
        this.material.backFaceCulling = false;

        this.uTranslationOffset = uniformFloat("uTranslationOffset", { defaultValue: 0 });
        this.uThrottle = uniformFloat("uThrottle", { defaultValue: 0 });
        this.uWarpForward = createUniformVector3("uWarpForward", new Vector3(0, 0, 1));
        this.uSteeringUp = createUniformVector3("uSteeringUp", new Vector3(0, 1, 0));
        this.uRollCompensationAngle = uniformFloat("uRollCompensationAngle", { defaultValue: 0 });
        this.uBendYaw = uniformFloat("uBendYaw", { defaultValue: 0 });
        this.uBendPitch = uniformFloat("uBendPitch", { defaultValue: 0 });

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
        const rollCompensationAngle = this.uRollCompensationAngle.output;
        const rotatedDiskSampleX = sub(
            mul(diskSample.x, cos(rollCompensationAngle)),
            mul(diskSample.y, sin(rollCompensationAngle)),
        );
        const rotatedDiskSampleY = add(
            mul(diskSample.x, sin(rollCompensationAngle)),
            mul(diskSample.y, cos(rollCompensationAngle)),
        );
        const phaseHash = hash11(add(instanceID, f(47)));
        const tunnelLength = f(this.tunnelLength);
        const halfTunnelLength = f(this.tunnelLength / 2);
        const initialPhase = mul(phaseHash, tunnelLength);
        const translationPhase = mod(add(initialPhase, translationOffset), tunnelLength);
        const translation = sub(translationPhase, halfTunnelLength);
        const centeredDistance = abs(translation);
        const curve01 = remap(centeredDistance, [0, this.tunnelLength / 2], [0, 1]);
        const curveAmount = mul(curve01, curve01);
        const bendDistance = mul(curveAmount, f(DEFAULT_MAX_BEND));
        const bendYaw = this.uBendYaw.output;
        const bendPitch = this.uBendPitch.output;
        const localX = add(rotatedDiskSampleX, mul(bendYaw, bendDistance));
        const localY = add(rotatedDiskSampleY, mul(bendPitch, bendDistance));

        const worldOrigin = swizzle(splitMatrix(globalWorld).row3, "xyz");
        const warpForward = this.uWarpForward.output;
        const steeringUp = this.uSteeringUp.output;
        const steeringRight = normalize(cross(steeringUp, warpForward));

        const instanceCenterW = addN([
            worldOrigin,
            mul(steeringRight, localX),
            mul(steeringUp, localY),
            mul(warpForward, translation),
        ]);

        const width = f(options?.width ?? DEFAULT_WIDTH);
        const stretch = remap(
            throttle,
            [0, 1],
            [options?.minStretch ?? DEFAULT_MIN_STRETCH, options?.maxStretch ?? DEFAULT_MAX_STRETCH],
        );

        const splitPosition = splitVec(position);
        const widthOffset = mul(splitPosition.x, width);
        const forwardOffset = mul(splitPosition.y, stretch);

        const cameraPosition = uniformCameraPosition();
        const toCamera = normalize(sub(cameraPosition, instanceCenterW));
        const billboardRight = normalize(cross(warpForward, toCamera));

        const rightOffset = mul(billboardRight, widthOffset);
        const forwardWorldOffset = mul(warpForward, forwardOffset);
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
        this.translationOffset = this.translationOffset % this.tunnelLength;
        this.uTranslationOffset.value = this.translationOffset;
    }

    public setThrottle(throttle: number) {
        this.throttle = throttle;
        this.uThrottle.value = throttle;
    }

    public setWarpFrame(forward: Vector3) {
        this.uWarpForward.value = forward;
    }

    public setSteeringFrame(up: Vector3) {
        this.uSteeringUp.value = up;
    }

    public setRollCompensationAngle(angle: number) {
        this.uRollCompensationAngle.value = angle;
    }

    public setSteeringBend(yaw: number, pitch: number) {
        this.uBendYaw.value = yaw;
        this.uBendPitch.value = -pitch;
    }

    public dispose() {
        this.material.dispose();
    }
}

function createUniformVector3(name: string, value: Vector3): InputBlock {
    const inputBlock = new InputBlock(name);
    inputBlock.target = NodeMaterialBlockTargets.Neutral;
    inputBlock.value = value;
    return inputBlock;
}
