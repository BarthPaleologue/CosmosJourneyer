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

import {
    ArcRotateCamera,
    Color4,
    Constants,
    Effect,
    Matrix,
    MeshBuilder,
    PostProcess,
    Scene,
    Texture,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { createStorageTexture3D } from "@/utils/texture";
import { Voronoi3dTextureGenerator } from "@/utils/textures/voronoi3d";

import shaderCode from "@shaders/volumetricClouds.glsl";

export async function createVolumetricCloudsPlayground(
    engine: WebGPUEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.defaultCursor = "default";

    const voronoiTextureGenerator = await Voronoi3dTextureGenerator.New(engine);

    const voronoiTexture = createStorageTexture3D(
        "VoronoiTexture",
        {
            width: 128,
            height: 128,
            depth: 128,
        },
        Constants.TEXTUREFORMAT_RGBA,
        scene,
        { samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    );

    voronoiTextureGenerator.dispatch(voronoiTexture);

    const dimensions = {
        width: 500,
        height: 40,
        depth: 500,
    };

    const cube = MeshBuilder.CreateBox("cube", dimensions, scene);
    cube.visibility = 0.1;

    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 1000, Vector3.Zero(), scene);
    camera.attachControl();

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);
    depthRenderer.clearColor = new Color4(0, 0, 0, 1);

    Effect.ShadersStore["cloudsPPFragmentShader"] = shaderCode;

    const pp = new PostProcess(
        "CloudsPP",
        "cloudsPP",
        [
            "time",
            "cloudBaseY",
            "cloudTopY",
            "density",
            "noiseScale",
            "steps",
            "cameraPos",
            "invProjection",
            "invView",
            "sunDir",
            "boxMin",
            "boxMax" /* ▶ */,
        ],
        ["uVoronoi", "depthSampler"],
        1.0,
        camera,
        Texture.BILINEAR_SAMPLINGMODE,
        engine,
        true,
    );

    pp.onApply = (effect) => {
        const t = performance.now() * 0.001;

        effect.setFloat("time", t);
        effect.setFloat("cloudBaseY", 0.0);
        effect.setFloat("cloudTopY", 20.0);
        effect.setFloat("density", 1.6);
        effect.setFloat("noiseScale", 0.01);
        effect.setInt("steps", 64);

        effect.setVector3("cameraPos", camera.globalPosition);
        effect.setVector3("sunDir", new Vector3(0.35, 0.7, 0.2).normalize());

        const invProj = Matrix.Invert(camera.getProjectionMatrix());
        const invView = Matrix.Invert(camera.getViewMatrix());
        effect.setMatrix("invProjection", invProj);
        effect.setMatrix("invView", invView);

        effect.setTexture("uVoronoi", voronoiTexture);
        effect.setTexture("depthSampler", depthRenderer.getDepthMap());

        effect.setVector3("boxMin", new Vector3(-dimensions.width / 2, -dimensions.height / 2, -dimensions.depth / 2)); // ▶
        effect.setVector3("boxMax", new Vector3(dimensions.width / 2, dimensions.height / 2, dimensions.depth / 2)); // ▶
    };

    return scene;
}
