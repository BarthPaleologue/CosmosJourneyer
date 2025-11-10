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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { ReflectionProbe } from "@babylonjs/core/Probes/reflectionProbe";
import { type Scene } from "@babylonjs/core/scene";
import HavokPhysics, { type HavokPhysicsWithBindings } from "@babylonjs/havok";
import { SkyMaterial } from "@babylonjs/materials";
import * as QRCode from "qrcode";

export async function enablePhysics(scene: Scene, gravity = Vector3.Zero(), havokInstance?: HavokPhysicsWithBindings) {
    const havokPlugin = new HavokPlugin(false, havokInstance ?? (await HavokPhysics()));
    scene.enablePhysics(gravity, havokPlugin);

    return havokPlugin;
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
