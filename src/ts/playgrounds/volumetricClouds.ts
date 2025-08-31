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
    Color3,
    Color4,
    Constants,
    DirectionalLight,
    Effect,
    Matrix,
    MeshBuilder,
    PostProcess,
    Scene,
    StandardMaterial,
    Texture,
    Vector2,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { createStorageTexture2D, createStorageTexture3D } from "@/utils/texture";
import { BlueNoise2dTextureGenerator } from "@/utils/textures/blueNoise2d";
import { Perlin3dTextureGenerator } from "@/utils/textures/perlin3d";
import { Worley3dTextureGenerator } from "@/utils/textures/worley3d";

import shaderCode from "@shaders/volumetricClouds.glsl";

export async function createVolumetricCloudsPlayground(
    engine: WebGPUEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.defaultCursor = "default";

    const worleyTextureGenerator = await Worley3dTextureGenerator.New(engine);

    const worleyTexture = createStorageTexture3D(
        "WorleyTexture",
        {
            width: 128,
            height: 128,
            depth: 128,
        },
        Constants.TEXTUREFORMAT_RGBA,
        scene,
        { samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    );

    worleyTextureGenerator.dispatch(worleyTexture);

    const perlinTextureGenerator = await Perlin3dTextureGenerator.New(engine);

    const perlinTexture = createStorageTexture3D(
        "PerlinTexture",
        {
            width: 128,
            height: 128,
            depth: 128,
        },
        Constants.TEXTUREFORMAT_RGBA,
        scene,
        { samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    );

    perlinTextureGenerator.dispatch(perlinTexture);

    const blueNoiseTextureGenerator = await BlueNoise2dTextureGenerator.New(engine);

    const blueNoiseTexture = createStorageTexture2D(
        "BlueNoiseTexture",
        {
            width: 128,
            height: 128,
        },
        Constants.TEXTUREFORMAT_RGBA,
        scene,
        { samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE, type: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    );

    blueNoiseTextureGenerator.dispatch(blueNoiseTexture);

    const dimensions = {
        width: 500,
        height: 50,
        depth: 500,
    };

    const volumeOffset = new Vector3(0, dimensions.height / 2, 0);

    const cube = MeshBuilder.CreateBox("cube", dimensions, scene);
    cube.position.addInPlace(volumeOffset);
    cube.visibility = 0.01;

    const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 500, Vector3.Zero(), scene);
    camera.attachControl();

    const depthRenderer = scene.enableDepthRenderer(camera, true, true);
    depthRenderer.clearColor = new Color4(0, 0, 0, 1);

    Effect.ShadersStore["cloudsPPFragmentShader"] = shaderCode;

    const pp = new PostProcess(
        "CloudsPP",
        "cloudsPP",
        ["time", "cameraPos", "invProjection", "invView", "sunDir", "boxMin", "boxMax", "frame", "resolution"],
        ["worley", "perlin", "blueNoise2d", "depthSampler"],
        1,
        camera,
        Texture.BILINEAR_SAMPLINGMODE,
        engine,
    );

    const lightDir = new Vector3(0.35, 0.2, 0.2).normalize();

    new DirectionalLight("directionalLight", lightDir.negate(), scene);

    const sunDisk = MeshBuilder.CreateSphere("sunDisk", { diameter: 25 }, scene);
    sunDisk.position = lightDir.scale(250);
    const diskMaterial = new StandardMaterial("sunDiskMaterial", scene);
    diskMaterial.emissiveColor = new Color3(1, 1, 0.8);
    sunDisk.material = diskMaterial;

    const ground = MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    ground.material = groundMaterial;

    let frameIndex = 0;
    pp.onApply = (effect) => {
        const t = performance.now() * 0.001;
        frameIndex++;

        effect.setFloat("time", t);

        effect.setVector3("cameraPos", camera.globalPosition);
        effect.setVector3("sunDir", lightDir);

        const invProj = Matrix.Invert(camera.getProjectionMatrix());
        const invView = Matrix.Invert(camera.getViewMatrix());
        effect.setMatrix("invProjection", invProj);
        effect.setMatrix("invView", invView);

        effect.setTexture("worley", worleyTexture);
        effect.setTexture("perlin", perlinTexture);
        effect.setTexture("blueNoise2d", blueNoiseTexture);
        effect.setTexture("depthSampler", depthRenderer.getDepthMap());

        effect.setVector3(
            "boxMin",
            new Vector3(-dimensions.width / 2, -dimensions.height / 2, -dimensions.depth / 2).addInPlace(volumeOffset),
        ); // ▶
        effect.setVector3(
            "boxMax",
            new Vector3(dimensions.width / 2, dimensions.height / 2, dimensions.depth / 2).addInPlace(volumeOffset),
        ); // ▶

        effect.setInt("frame", frameIndex);
        effect.setVector2("resolution", new Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
    };

    return scene;
}
