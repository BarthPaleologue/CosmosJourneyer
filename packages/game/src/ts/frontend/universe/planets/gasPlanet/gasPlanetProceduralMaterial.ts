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

import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Scene } from "@babylonjs/core/scene";

import { type GasPlanetProceduralColorPalette } from "@/backend/universe/orbitalObjects/gasPlanetModel";

import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";

import { type DeepReadonly } from "@/utils/types";

import surfaceMaterialFragment from "@shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "@shaders/gasPlanetMaterial/vertex.glsl";

const GasPlanetMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    SEED: "seed",
    TIME: "time",
    COLOR1: "color1",
    COLOR2: "color2",
    COLOR3: "color3",
    COLOR_SHARPNESS: "colorSharpness",
};

export class GasPlanetProceduralMaterial extends ShaderMaterial {
    private elapsedSeconds = 0;

    constructor(
        planetName: string,
        seed: number,
        colorPalette: DeepReadonly<GasPlanetProceduralColorPalette>,
        scene: Scene,
    ) {
        const shaderName = "gasPlanetMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${planetName}GasSurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [...Object.values(GasPlanetMaterialUniformNames), ...Object.values(StellarObjectUniformNames)],
        });

        this.setFloat(GasPlanetMaterialUniformNames.SEED, seed);

        this.setArray3(GasPlanetMaterialUniformNames.COLOR1, [
            colorPalette.color1.r,
            colorPalette.color1.g,
            colorPalette.color1.b,
        ]);
        this.setArray3(GasPlanetMaterialUniformNames.COLOR2, [
            colorPalette.color2.r,
            colorPalette.color2.g,
            colorPalette.color2.b,
        ]);
        this.setArray3(GasPlanetMaterialUniformNames.COLOR3, [
            colorPalette.color3.r,
            colorPalette.color3.g,
            colorPalette.color3.b,
        ]);

        this.setFloat(GasPlanetMaterialUniformNames.COLOR_SHARPNESS, colorPalette.colorSharpness);

        const tempCameraPosition = new Vector3();
        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if (activeCamera === null) {
                console.warn("No active camera in the scene");
                return;
            }

            const floatingOriginEnabled = scene.floatingOriginMode;
            this.getEffect().setVector3(
                GasPlanetMaterialUniformNames.CAMERA_POSITION,
                floatingOriginEnabled
                    ? Vector3.ZeroReadOnly
                    : activeCamera.getWorldMatrix().getTranslationToRef(tempCameraPosition),
            );
        });
    }

    public update(stellarObjects: ReadonlyArray<PointLight>, deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;

        this.onBindObservable.addOnce(() => {
            const floatingOriginOffset = this.getScene().floatingOriginOffset;
            setStellarObjectUniforms(this.getEffect(), stellarObjects, floatingOriginOffset);
            this.getEffect().setFloat(GasPlanetMaterialUniformNames.TIME, this.elapsedSeconds % 100000);
        });
    }

    public override dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean) {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
    }
}
