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
    Constants,
    Effect,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    ShaderMaterial,
    Vector3,
    type RawTexture3D,
    type WebGPUEngine,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Slider, StackPanel } from "@babylonjs/gui";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";

import { createStorageTexture3D } from "@/utils/texture";
import { Voronoi3dTextureGenerator } from "@/utils/textures/voronoi3d";

const createSlider = (
    name: string,
    min: number,
    max: number,
    onValueChanged: (value: number) => void,
    parent: StackPanel,
) => {
    const slider = new Slider();
    slider.minimum = min;
    slider.maximum = max;
    slider.value = 0;
    slider.width = "200px";
    slider.height = "40px";
    slider.onValueChangedObservable.add(onValueChanged);
    parent.addControl(slider);
};

export async function createTexture3dPlayground(
    engine: WebGPUEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.defaultCursor = "default";

    // This creates and positions a free camera (non-mesh)
    const camera = new ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, Vector3.Zero(), scene);
    camera.wheelPrecision *= 10;
    camera.minZ = 0.1;

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    const box = MeshBuilder.CreateBox("box", { size: 1 + 1e-3 }, scene);
    box.visibility = 0.2;

    const xzPlane = MeshBuilder.CreatePlane("xzPlane", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene);
    xzPlane.rotation.x = Math.PI / 2; // XY → XZ (u→X, v→Z)
    xzPlane.rotation.y = -Math.PI / 2;

    const xyPlane = MeshBuilder.CreatePlane("xyPlane", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene);

    const yzPlane = MeshBuilder.CreatePlane("yzPlane", { size: 1, sideOrientation: Mesh.DOUBLESIDE }, scene);
    yzPlane.rotation.y = Math.PI / 2; // XY → YZ (u→Z, v→Y)

    // GUI
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const panel = new StackPanel();
    panel.isVertical = false;
    panel.height = "100px";
    panel.horizontalAlignment = StackPanel.HORIZONTAL_ALIGNMENT_CENTER;

    const panelParent = new StackPanel();
    panelParent.verticalAlignment = StackPanel.VERTICAL_ALIGNMENT_BOTTOM;
    panelParent.addControl(panel);

    advancedTexture.addControl(panelParent);

    const urlParams = new URLSearchParams(window.location.search);

    let texture: RawTexture3D;
    if (urlParams.get("texture") === "voronoi") {
        texture = createStorageTexture3D(
            "voronoiTexture",
            { width: 128, height: 128, depth: 128 },
            Constants.TEXTUREFORMAT_RGBA,
            scene,
            { type: Constants.TEXTURETYPE_UNSIGNED_BYTE },
        );

        const voronoi3dTextureGenerator = await Voronoi3dTextureGenerator.New(engine);
        voronoi3dTextureGenerator.dispatch(texture);
    } else {
        const data = new Float32Array(128 * 128 * 128 * 4);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random();
        }

        texture = createStorageTexture3D(
            "testTexture",
            { width: 16, height: 16, depth: 16 },
            Constants.TEXTUREFORMAT_RGBA,
            scene,
            { data, type: Constants.TEXTURETYPE_FLOAT },
        );
    }

    Effect.ShadersStore["customVertexShader"] = `
        precision highp float;
        attribute vec3 position;

        uniform mat4 worldViewProjection;
        uniform mat4 world;

        varying vec3 vPositionW;

        void main() {
            vec4 p = vec4(position, 1.);

            vPositionW = (world * p).xyz;

            gl_Position = worldViewProjection * p;
        }
    `;

    Effect.ShadersStore["customFragmentShader"] = `
        precision highp float;

        uniform sampler3D volumeTexture;
        varying vec3 vPositionW;

        void main() {
            gl_FragColor = texture(volumeTexture, vPositionW);
        }
    `;

    const clipPlaneMaterial = new ShaderMaterial("PlaneMaterial", scene, "custom", {
        attributes: ["position"],
        uniforms: ["worldViewProjection", "world"],
        samplers: ["volumeTexture"],
    });
    clipPlaneMaterial.setTexture("volumeTexture", texture);

    xzPlane.material = clipPlaneMaterial;
    xyPlane.material = clipPlaneMaterial;
    yzPlane.material = clipPlaneMaterial;

    createSlider(
        "XZ",
        -0.5,
        0.5,
        (value) => {
            xzPlane.position.y = value;
        },
        panel,
    );

    createSlider(
        "XY",
        -0.5,
        0.5,
        (value) => {
            xyPlane.position.z = value;
        },
        panel,
    );

    createSlider(
        "YZ",
        -0.5,
        0.5,
        (value) => {
            yzPlane.position.x = value;
        },
        panel,
    );

    return scene;
}
