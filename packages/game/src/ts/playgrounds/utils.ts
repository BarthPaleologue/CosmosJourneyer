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

import "@babylonjs/core/Physics/physicsEngineComponent";

import {
    CascadedShadowGenerator,
    HavokPlugin,
    MeshBuilder,
    ReflectionProbe,
    Vector3,
    type AbstractEngine,
    type AbstractMesh,
    type Camera,
    type DepthRenderer,
    type DirectionalLight,
    type PhysicsEngineV2,
    type Scene,
} from "@babylonjs/core";
import HavokPhysics, { type HavokPhysicsWithBindings } from "@babylonjs/havok";
import { SkyMaterial } from "@babylonjs/materials";
import * as QRCode from "qrcode";

export async function enablePhysics(
    scene: Scene,
    gravity = Vector3.Zero(),
    havokInstance?: HavokPhysicsWithBindings,
): Promise<PhysicsEngineV2> {
    const havokPlugin = new HavokPlugin(true, havokInstance ?? (await HavokPhysics()));
    scene.enablePhysics(gravity, havokPlugin);

    return scene.getPhysicsEngine() as PhysicsEngineV2;
}

export function enablePointerLock(engine: AbstractEngine) {
    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });
}

export function createSky(sunPosition: Vector3, scene: Scene, options?: Partial<{ size: number }>): void {
    const skyMaterial = new SkyMaterial("skyMaterial", scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.sunPosition = sunPosition;
    skyMaterial.useSunPosition = true;

    const skybox = MeshBuilder.CreateBox("skyBox", { size: options?.size ?? 1e3 }, scene);
    skybox.material = skyMaterial;
    skybox.infiniteDistance = true;
    skybox.isPickable = false;
    skybox.ignoreCameraMaxZ = true;

    const rp = new ReflectionProbe("ref", 512, scene);
    rp.renderList?.push(skybox);

    scene.customRenderTargets.push(rp.cubeTexture);

    scene.environmentTexture = rp.cubeTexture;
}

export function enableShadows(
    light: DirectionalLight,
    options?: Partial<{
        maxZ: number;
        cascadeCount: number;
        resolution: number;
        debug: boolean;
        depthRenderer: DepthRenderer;
    }>,
): CascadedShadowGenerator {
    const shadowGenerator = new CascadedShadowGenerator(options?.resolution ?? 2048, light);
    shadowGenerator.transparencyShadow = true;

    // see https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows_csm#optimizing-for-quality
    shadowGenerator.stabilizeCascades = false;
    shadowGenerator.autoCalcDepthBounds = true;
    shadowGenerator.lambda = 1;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = CascadedShadowGenerator.QUALITY_HIGH;
    shadowGenerator.depthClamp = true;
    shadowGenerator.numCascades = options?.cascadeCount ?? 4;

    shadowGenerator.shadowMaxZ = options?.maxZ ?? 200;
    shadowGenerator.bias *= 50;
    shadowGenerator.normalBias *= 50;
    shadowGenerator.debug = options?.debug ?? false;

    const applyShadowsToMesh = (mesh: AbstractMesh) => {
        if (mesh.infiniteDistance) {
            return;
        }

        shadowGenerator.addShadowCaster(mesh);
        mesh.receiveShadows = true;
    };

    for (const mesh of light.getScene().meshes) {
        applyShadowsToMesh(mesh);
    }

    light.getScene().onNewMeshAddedObservable.add((mesh) => {
        applyShadowsToMesh(mesh);
    });

    const cameraToDepthRenderer = new Map<Camera, DepthRenderer>();
    let activeCamera: Camera | null = null;
    light.getScene().onBeforeCameraRenderObservable.add((camera) => {
        if (camera === activeCamera) {
            return;
        }

        for (const depthRenderer of cameraToDepthRenderer.values()) {
            depthRenderer.enabled = false;
        }

        activeCamera = camera;
        let depthRenderer = cameraToDepthRenderer.get(camera);
        if (depthRenderer === undefined) {
            depthRenderer = light.getScene().enableDepthRenderer(camera);
            cameraToDepthRenderer.set(camera, depthRenderer);
        }

        depthRenderer.enabled = true;
        shadowGenerator.setDepthRenderer(depthRenderer);
        shadowGenerator.autoCalcDepthBounds = true;
    });

    return shadowGenerator;
}

export async function renderQrCodeOverlay(qrUrl: string): Promise<void> {
    const qrOverlay = document.createElement("div");
    qrOverlay.style.position = "fixed";
    qrOverlay.style.right = "1.5rem";
    qrOverlay.style.bottom = "1.5rem";
    qrOverlay.style.zIndex = "1000";
    qrOverlay.style.padding = "0.75rem";
    qrOverlay.style.borderRadius = "0.75rem";
    qrOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    qrOverlay.style.backdropFilter = "blur(4px)";
    qrOverlay.style.display = "flex";
    qrOverlay.style.flexDirection = "column";
    qrOverlay.style.alignItems = "center";
    qrOverlay.style.gap = "0.5rem";
    qrOverlay.style.maxWidth = "15rem";
    qrOverlay.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.35)";

    const qrCanvas = document.createElement("canvas");
    qrCanvas.style.width = "12rem";
    qrCanvas.style.height = "12rem";
    qrOverlay.appendChild(qrCanvas);

    const qrLabel = document.createElement("div");
    qrLabel.style.color = "white";
    qrLabel.style.fontFamily = "monospace";
    qrLabel.style.fontSize = "0.75rem";
    qrLabel.style.wordBreak = "break-all";
    qrLabel.style.textAlign = "center";

    qrLabel.textContent = qrUrl;
    qrOverlay.appendChild(qrLabel);

    document.body.appendChild(qrOverlay);

    try {
        await QRCode.toCanvas(qrCanvas, qrUrl, {
            width: 192,
            margin: 1,
            color: {
                dark: "#000000ff",
                light: "#ffffffff",
            },
        });
    } catch (error) {
        console.error("Failed to render QR code", error);
        qrOverlay.remove();
    }
}

export function addToWindow(name: string, value: unknown) {
    (window as typeof window & { [name]: unknown })[name] = value;
}
