//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Vector3,
} from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadHumanoidPrefabs } from "@/frontend/assets/objects/humanoids";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { makeQrCodeTexture, decodeQrCodeFromScreenshot } from "@/frontend/helpers/qr";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { alertModal } from "@/frontend/ui/dialogModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import i18n, { initI18n } from "@/i18n";
import { CollisionMask } from "@/settings";

import { createSky, enablePhysics, enablePointerLock, enableShadows } from "./utils";

export async function createQrScanScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await initI18n();
    const physicsEngine = await enablePhysics(scene, new Vector3(0, -9.81, 0));
    enablePointerLock(engine);

    const light = new DirectionalLight("sun", new Vector3(-1, -2, 1), scene);
    light.position = new Vector3(10, 20, -10);
    createSky(light.direction.scale(-1), scene);

    const ambientLight = new HemisphericLight("ambientLight", Vector3.Up(), scene);
    ambientLight.intensity = 0.4;

    const ground = MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor = new Color3(0.35, 0.4, 0.32);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.9;
    ground.material = groundMaterial;

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 2 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

    const wallZ = 8;
    const wallThickness = 0.3;
    const wall = MeshBuilder.CreateBox("wall", { width: 4, height: 3, depth: wallThickness }, scene);
    wall.position.copyFromFloats(0, 1.5, wallZ);
    const wallMaterial = new PBRMaterial("wallMaterial", scene);
    wallMaterial.albedoColor = new Color3(0.18, 0.2, 0.22);
    wallMaterial.metallic = 0;
    wallMaterial.roughness = 0.8;
    wall.material = wallMaterial;

    const wallAggregate = new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0, friction: 1 }, scene);
    wallAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

    const qrTexture = await makeQrCodeTexture("Hello world! What a nice day to be scanning QR codes :)", scene, {
        width: 512,
    });

    const qrPlane = MeshBuilder.CreatePlane("interactiveQrCode", { size: 0.5 }, scene);
    qrPlane.position.copyFromFloats(0, 1.5, wallZ - wallThickness / 2 - 0.001);
    const qrMaterial = new PBRMaterial("qrCodeMaterial", scene);
    qrMaterial.albedoTexture = qrTexture;
    qrMaterial.metallic = 0;
    qrMaterial.roughness = 0.7;
    qrPlane.material = qrMaterial;

    const qrAggregate = new PhysicsAggregate(qrPlane, PhysicsShapeType.BOX, { mass: 0 }, scene);

    const humanoids = await loadHumanoidPrefabs(scene, progressMonitor);
    const humanoidInstance = humanoids.placeholder.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const character = new HumanoidAvatar(humanoidInstance.value, physicsEngine, scene);
    const characterControls = new CharacterControls(character, scene);
    characterControls.firstPersonCamera.minZ = 0.1;
    characterControls.firstPersonCamera.attachControl();
    CharacterInputs.setEnabled(true);

    enableShadows(light, new DepthRendererManager(scene));

    const soundPlayer = new SoundPlayerMock();
    const interactionSystem = new InteractionSystem(CollisionMask.INTERACTIVE, scene, async (interactions) => {
        return Promise.resolve(interactions[0] ?? null);
    });
    interactionSystem.enableForCamera(characterControls.firstPersonCamera, 5);
    interactionSystem.enableForCamera(characterControls.thirdPersonCamera, 7);

    const interactionLayer = new InteractionLayer(interactionSystem, await getGlobalKeyboardLayoutMap());
    document.body.appendChild(interactionLayer.root);

    interactionSystem.register({
        getPhysicsAggregate: () => qrAggregate,
        getInteractions: () => [
            {
                label: i18n.t("interactions:scan"),
                perform: async (): Promise<void> => {
                    const camera = scene.activeCamera;
                    if (camera === null) {
                        return;
                    }

                    const decodedText = await decodeQrCodeFromScreenshot(engine, camera);
                    scene.activeCamera?.detachControl();
                    document.exitPointerLock();
                    await alertModal(decodedText ?? "No QR code found in the screenshot.", soundPlayer);
                    scene.activeCamera?.attachControl();
                },
            },
        ],
    });

    scene.onBeforeRenderObservable.add(() => {
        if (characterControls.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();
            const camera = characterControls.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = engine.getDeltaTime() / 1000;
        characterControls.update(deltaSeconds);
        interactionSystem.update(deltaSeconds);
        interactionLayer.update(deltaSeconds);
    });

    return scene;
}
