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
    Color3,
    CreateAudioEngineAsync,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    Vector3,
    type AbstractEngine,
} from "@babylonjs/core";

import { loadSounds } from "@/frontend/assets/audio/sounds";
import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadHumanoidPrefabs } from "@/frontend/assets/objects/humanoids";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { Button } from "@/frontend/ui/3d/button";
import { radialChoiceModal } from "@/frontend/ui/dialogModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import { initI18n } from "@/i18n";
import { CollisionMask } from "@/settings";

import { createSky, enablePhysics, enablePointerLock, enableShadows } from "./utils";

export async function createInteractionDemo(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await initI18n();

    const physicsEngine = await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const audioEngine = await CreateAudioEngineAsync();

    enablePointerLock(engine);

    const humanoids = await loadHumanoidPrefabs(scene, progressMonitor);

    const sounds = await loadSounds(audioEngine, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(0, -1, -1), scene);

    createSky(light.direction.scale(-1), scene);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.1;

    const groundSize = 100;
    const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, scene);

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor = new Color3(0.7, 0.7, 0.7);
    groundMaterial.roughness = 0.7;
    groundMaterial.metallic = 0;
    ground.material = groundMaterial;

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    groundAggregate.shape.material.friction = 2;

    const humanoidInstance = humanoids.placeholder.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const humanoidAvatar = new HumanoidAvatar(humanoidInstance.value, physicsEngine, scene);

    const characterControls = new CharacterControls(humanoidAvatar, scene);
    characterControls.getActiveCamera().attachControl();

    characterControls.getActiveCamera().minZ = 0.1;

    CharacterInputs.setEnabled(true);

    enableShadows(light);

    const soundPlayer = new SoundPlayerMock();

    const interactionSystem = new InteractionSystem(
        CollisionMask.INTERACTIVE,
        scene,
        [characterControls.firstPersonCamera],
        async (interactions) => {
            if (interactions.length === 0) {
                return null;
            }

            scene.activeCamera?.detachControl();
            const choice = await radialChoiceModal(interactions, (interaction) => interaction.label, soundPlayer, {
                useVirtualCursor: engine.isPointerLock,
            });
            scene.activeCamera?.attachControl(true);
            return choice;
        },
    );

    const interactionLayer = new InteractionLayer(interactionSystem, await getGlobalKeyboardLayoutMap());
    document.body.appendChild(interactionLayer.root);

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const size = 0.2 + Math.random();
        const position = new Vector3((Math.random() - 0.5) * groundSize, size / 2, (Math.random() - 0.5) * groundSize);
        spawnBoxAtPosition({ position, size }, scene, interactionSystem);
    }

    const pillarHeight = 1.0;
    const pillar = MeshBuilder.CreateBox("pillar", { width: 0.3, depth: 0.3, height: pillarHeight }, scene);
    pillar.position.z = 2;
    pillar.position.y = pillarHeight / 2;

    const pillarMaterial = new PBRMaterial("pillarMaterial", scene);
    pillarMaterial.albedoColor = new Color3(0.4, 0.4, 0.4);
    pillarMaterial.roughness = 0.9;
    pillarMaterial.metallic = 0;
    pillar.material = pillarMaterial;

    const button = new Button(
        {
            label: "Spawn Box",
            perform: () => {
                sounds.menuSelect.setVolume(5);
                sounds.menuSelect.play();

                const boxSize = 0.3 + Math.random() * 0.3;
                const camera = scene.activeCamera;
                if (camera === null) {
                    return Promise.resolve();
                }

                const cameraRay = camera.getForwardRay(
                    5,
                    camera.getWorldMatrix(),
                    camera.getWorldMatrix().getTranslation(),
                );

                const boxPosition = cameraRay.origin.add(cameraRay.direction.scale(7));
                boxPosition.y = 3 + Math.max(boxPosition.y, boxSize / 2);

                spawnBoxAtPosition({ position: boxPosition, size: boxSize }, scene, interactionSystem);
                return Promise.resolve();
            },
        },
        scene,
    );
    button.getTransform().position = pillar.position.add(new Vector3(0, pillarHeight / 2 + 0.05, 0));

    interactionSystem.register(button);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        interactionSystem.update(deltaSeconds);
        interactionLayer.update(deltaSeconds);

        if (characterControls.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = characterControls.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        characterControls.update(deltaSeconds);
    });

    return scene;
}

function spawnBoxAtPosition(
    { position, size }: { position: Vector3; size: number },
    scene: Scene,
    interactionSystem: InteractionSystem,
): PhysicsAggregate {
    const box = MeshBuilder.CreateBox(`box`, { size }, scene);
    box.position = position;
    box.rotation.y = Math.random();

    const boxMaterial = new PBRMaterial("boxMaterial", scene);
    boxMaterial.albedoColor = Color3.Random();
    boxMaterial.metallic = 0;
    boxMaterial.roughness = 0.7;
    box.material = boxMaterial;

    const boxAggregate = new PhysicsAggregate(
        box,
        PhysicsShapeType.BOX,
        { mass: 50, restitution: 0.3, friction: 1 },
        scene,
    );
    boxAggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

    interactionSystem.register({
        getPhysicsAggregate: () => boxAggregate,
        getInteractions: () => [
            {
                label: "push",
                perform: () => {
                    const cameraRay = scene.activeCamera?.getForwardRay(
                        1,
                        scene.activeCamera.getWorldMatrix(),
                        scene.activeCamera.getWorldMatrix().getTranslation(),
                    );
                    if (cameraRay === undefined) {
                        return Promise.resolve();
                    }

                    boxAggregate.body.applyImpulse(
                        cameraRay.direction.scale(200).add(Vector3.Up().scale(200)),
                        boxAggregate.body.getObjectCenterWorld(),
                    );
                    boxAggregate.body.applyAngularImpulse(
                        new Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                    );
                    return Promise.resolve();
                },
            },
            {
                label: "spin",
                perform: () => {
                    boxAggregate.body.applyAngularImpulse(new Vector3(0, 50, 0));
                    return Promise.resolve();
                },
            },
            {
                label: "change color",
                perform: () => {
                    box.material = new PBRMaterial("boxMaterial", scene);
                    (box.material as PBRMaterial).albedoColor = Color3.Random();
                    (box.material as PBRMaterial).metallic = 0;
                    (box.material as PBRMaterial).roughness = 0.7;
                    return Promise.resolve();
                },
            },
            {
                label: "delete",
                perform: () => {
                    box.dispose();
                    return Promise.resolve();
                },
            },
            {
                label: "make bouncy",
                perform: () => {
                    boxAggregate.shape.material.restitution = 1.5;
                    return Promise.resolve();
                },
            },
        ],
    });

    return boxAggregate;
}
