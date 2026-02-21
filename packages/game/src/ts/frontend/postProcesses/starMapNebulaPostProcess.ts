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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PassPostProcess } from "@babylonjs/core/PostProcesses/passPostProcess";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { CameraUniformNames, setCameraUniforms } from "@/frontend/postProcesses/uniforms/cameraUniforms";

import starmapNebulaCompositeFragment from "@shaders/starmapNebulaComposite.glsl";
import starmapNebulaFogFragment from "@shaders/starmapNebulaFog.glsl";

const fogShaderName = "starmapNebulaFog";
const compositeShaderName = "starmapNebulaComposite";
const uniformNames = {
    INTENSITY: "intensity",
    NEBULA_CELL_SIZE: "nebula_cell_size",
    NEBULA_CELL_ID: "nebula_cell_id",
    NEBULA_CELL_OFFSET: "nebula_cell_offset",
};

const NEBULA_CELL_SIZE = 2048;
const tempNebulaCellId = new Vector3();
const tempNebulaCellOffset = new Vector3();

export class StarMapNebulaPostProcess {
    private activeCamera: Camera | null = null;
    private readonly intensity = 0.02;

    private readonly sceneCopyPass: PassPostProcess;
    private readonly fogPass: PostProcess;
    private readonly compositePass: PostProcess;

    constructor(scene: Scene, camera: Camera) {
        Effect.ShadersStore[`${fogShaderName}FragmentShader`] ??= starmapNebulaFogFragment;
        Effect.ShadersStore[`${compositeShaderName}FragmentShader`] ??= starmapNebulaCompositeFragment;

        this.sceneCopyPass = new PassPostProcess(
            "StarMapNebulaSceneCopy",
            1,
            camera,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.fogPass = new PostProcess(
            "StarMapNebulaFogHalfRes",
            fogShaderName,
            [...Object.values(CameraUniformNames), ...Object.values(uniformNames)],
            [],
            0.25,
            camera,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.fogPass.onActivateObservable.add((activeCamera) => {
            this.activeCamera = activeCamera;
        });

        this.fogPass.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) return;
            const floatingOriginEnabled = scene.floatingOriginMode;
            const floatingOriginOffset = scene.floatingOriginOffset;
            setCameraUniforms(effect, this.activeCamera, floatingOriginEnabled);
            effect.setFloat(uniformNames.INTENSITY, this.intensity);
            effect.setFloat(uniformNames.NEBULA_CELL_SIZE, NEBULA_CELL_SIZE);

            const nebulaCellIdX = Math.floor(floatingOriginOffset.x / NEBULA_CELL_SIZE);
            const nebulaCellIdY = Math.floor(floatingOriginOffset.y / NEBULA_CELL_SIZE);
            const nebulaCellIdZ = Math.floor(floatingOriginOffset.z / NEBULA_CELL_SIZE);

            tempNebulaCellId.set(nebulaCellIdX, nebulaCellIdY, nebulaCellIdZ);
            tempNebulaCellOffset.set(
                floatingOriginOffset.x - nebulaCellIdX * NEBULA_CELL_SIZE,
                floatingOriginOffset.y - nebulaCellIdY * NEBULA_CELL_SIZE,
                floatingOriginOffset.z - nebulaCellIdZ * NEBULA_CELL_SIZE,
            );

            effect.setVector3(uniformNames.NEBULA_CELL_ID, tempNebulaCellId);
            effect.setVector3(uniformNames.NEBULA_CELL_OFFSET, tempNebulaCellOffset);
        });

        this.compositePass = new PostProcess(
            "StarMapNebulaComposite",
            compositeShaderName,
            [],
            ["sceneSampler"],
            1,
            camera,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.compositePass.onApplyObservable.add((effect) => {
            effect.setTextureFromPostProcess("sceneSampler", this.sceneCopyPass);
        });
    }

    dispose(): void {
        this.compositePass.dispose();
        this.fogPass.dispose();
        this.sceneCopyPass.dispose();
    }
}
