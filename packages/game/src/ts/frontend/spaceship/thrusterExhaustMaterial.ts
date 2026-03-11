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

import { Engine } from "@babylonjs/core/Engines/engine";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type Scene } from "@babylonjs/core/scene";

import { OffsetWorldToRef } from "../helpers/floatingOrigin";

import thrusterExhaustFragment from "@shaders/thrusterExhaustMaterial/fragment.glsl";
import thrusterExhaustVertex from "@shaders/thrusterExhaustMaterial/vertex.glsl";

const EXHAUST_SHADER_NAME = "thrusterExhaustMaterial";
const DEFAULT_EMISSION_INTENSITY = 1.0;
const DEFAULT_RAY_MARCH_STEP_COUNT = 64;

export type ThrusterExhaustCrossSection = {
    readonly x: number;
    readonly z: number;
};

export type ThrusterExhaustMaterialOptions = Partial<{
    readonly crossSection?: ThrusterExhaustCrossSection;
    readonly emissionIntensity?: number;
    readonly rayMarchStepCount?: number;
}>;

export class ThrusterExhaustMaterial {
    private readonly material: ShaderMaterial;
    private elapsedSeconds = 0;

    private readonly transform: TransformNode;

    private readonly offsetWorld = new Matrix();
    private readonly inverseWorld = new Matrix();

    private readonly scene: Scene;

    readonly crossSection: ThrusterExhaustCrossSection;

    constructor(name: string, exhaustTransform: TransformNode, scene: Scene, options?: ThrusterExhaustMaterialOptions) {
        this.crossSection = {
            x: options?.crossSection?.x ?? 0.4,
            z: options?.crossSection?.z ?? 0.4,
        };

        Effect.ShadersStore[`${EXHAUST_SHADER_NAME}VertexShader`] ??= thrusterExhaustVertex;
        Effect.ShadersStore[`${EXHAUST_SHADER_NAME}FragmentShader`] ??= thrusterExhaustFragment;
        this.material = new ShaderMaterial(`${name}Material`, scene, EXHAUST_SHADER_NAME, {
            attributes: ["position"],
            uniforms: [
                "world",
                "worldViewProjection",
                "inverseWorld",
                "elapsedSeconds",
                "view",
                "exhaustPressureRatio",
                "exhaustRoundness",
                "throttle",
                "exhaustSpeed",
                "exhaustLength",
                "emissionIntensity",
            ],
            defines: [
                `CROSS_SECTION_EXTENT_X ${this.crossSection.x}`,
                `CROSS_SECTION_EXTENT_Z ${this.crossSection.z}`,
                `RAY_MARCH_STEP_COUNT ${options?.rayMarchStepCount ?? DEFAULT_RAY_MARCH_STEP_COUNT}`,
            ],
            needAlphaBlending: true,
        });
        this.material.backFaceCulling = false;
        this.material.alphaMode = Engine.ALPHA_ADD;
        this.material.disableDepthWrite = true;
        this.material.setFloat("emissionIntensity", options?.emissionIntensity ?? DEFAULT_EMISSION_INTENSITY);

        this.transform = exhaustTransform;
        this.scene = scene;
    }

    get(): ShaderMaterial {
        return this.material;
    }

    update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.material.setFloat("elapsedSeconds", this.elapsedSeconds);

        const world = this.transform.computeWorldMatrix(true);
        OffsetWorldToRef(this.scene.floatingOriginOffset, world, this.offsetWorld);
        this.offsetWorld.invertToRef(this.inverseWorld);
        this.material.setMatrix("inverseWorld", this.inverseWorld);
    }

    setInverseWorld(inverseWorld: Matrix) {
        this.material.setMatrix("inverseWorld", inverseWorld);
    }

    setPressureRatio(pressureRatio: number) {
        this.material.setFloat("exhaustPressureRatio", pressureRatio);
    }

    setRoundness(roundness: number) {
        this.material.setFloat("exhaustRoundness", roundness);
    }

    setThrottle(throttle: number) {
        this.material.setFloat("throttle", throttle);
    }

    setExhaustSpeed(exhaustSpeed: number) {
        this.material.setFloat("exhaustSpeed", exhaustSpeed);
    }

    setLength(length: number) {
        this.material.setFloat("exhaustLength", length);
    }

    dispose() {
        this.material.dispose();
    }
}
