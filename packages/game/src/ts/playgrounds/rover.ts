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
import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayer } from "@/frontend/audio/soundPlayer";
import type { Controls } from "@/frontend/controls";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { radialChoiceModal } from "@/frontend/ui/dialogModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";
import { VehicleControls } from "@/frontend/vehicle/vehicleControls";
import { VehicleInputs } from "@/frontend/vehicle/vehicleControlsInputs";
import { createWolfMk2 } from "@/frontend/vehicle/worlfMk2";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import { initI18n } from "@/i18n";
import { CollisionMask } from "@/settings";

import { createSky, enablePhysics, enableShadows } from "./utils";

export async function createRoverScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await initI18n();

    const physicsEngine = await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const audioEngine = await CreateAudioEngineAsync();

    const assets = await loadRenderingAssets(scene, progressMonitor);
    const sounds = await loadSounds(audioEngine, progressMonitor);

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const humanoidInstance = assets.objects.humanoids.placeholder.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const humanoidAvatar = new HumanoidAvatar(humanoidInstance.value, physicsEngine, scene);

    const character = new CharacterControls(humanoidAvatar, scene);
    character.getTransform().position = new Vector3(10, 0, -10);
    character.firstPersonCamera.minZ = 0.1;

    const soundPlayer = new SoundPlayer(sounds);
    const interactionSystem = new InteractionSystem(
        CollisionMask.INTERACTIVE,
        scene,
        [character.firstPersonCamera],
        async (interactions) => {
            if (interactions.length === 0) {
                return null;
            }

            const hasPointerLock = engine.isPointerLock;
            if (hasPointerLock) {
                document.exitPointerLock();
            }
            const choice = await radialChoiceModal(interactions, (interaction) => interaction.label, soundPlayer);
            if (hasPointerLock) {
                await engine.getRenderingCanvas()?.requestPointerLock();
            }

            return choice;
        },
    );

    const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

    const interactionLayer = new InteractionLayer(interactionSystem, keyboardLayoutMap);
    document.body.appendChild(interactionLayer.root);

    const sun = new DirectionalLight("sun", new Vector3(1, -1, -0.5), scene);

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 0.02;

    createSky(sun.direction.scale(-1), scene);

    const ground = MeshBuilder.CreateGround("ground", { width: 3000, height: 3000 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -2;

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor.set(0.8, 0.4, 0.2);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.7;
    ground.material = groundMaterial;

    const groundAggregate = new PhysicsAggregate(
        ground,
        PhysicsShapeType.BOX,
        { mass: 0, restitution: 0, friction: 2 },
        scene,
    );
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

    enableShadows(sun);

    const roverResult = createWolfMk2(assets, scene, new Vector3(0, 5, 0), {
        axis: new Vector3(0, 1, 0),
        angle: Math.PI / 4,
    });
    if (!roverResult.success) {
        throw new Error(roverResult.error);
    }

    const rover = roverResult.value;

    const roverControls = new VehicleControls(scene);
    roverControls.setVehicle(rover);
    roverControls.switchToThirdPersonCamera();

    let activeControls: Controls = roverControls;

    const setRoverActive = () => {
        activeControls = roverControls;
        VehicleInputs.setEnabled(true);
        CharacterInputs.setEnabled(false);
        character.setThirdPersonCameraActive();
    };

    const setCharacterActive = () => {
        activeControls = character;
        character.setFirstPersonCameraActive();
        VehicleInputs.setEnabled(false);
        CharacterInputs.setEnabled(true);
    };

    setRoverActive();

    interactionSystem.register({
        getPhysicsAggregate: () => rover.frame,
        getInteractions: () => [
            {
                label: "Drive",
                perform: () => {
                    setRoverActive();
                    return Promise.resolve();
                },
            },
        ],
    });

    for (const door of rover.doors) {
        interactionSystem.register(door);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key !== "e") {
            return;
        }
        if (activeControls === roverControls) {
            setCharacterActive();
        }
    });

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const box = MeshBuilder.CreateBox(`box${i}`, { size: 0.2 + Math.random() }, scene);
        box.position = new Vector3((Math.random() - 0.5) * 200, 0, (Math.random() - 0.5) * 200);
        box.rotation = new Vector3(Math.random(), Math.random(), Math.random());

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
        interactionSystem.register({
            getPhysicsAggregate: () => boxAggregate,
            getInteractions: () => [
                {
                    label: "spin",
                    perform: () => {
                        boxAggregate.body.applyAngularImpulse(new Vector3(0, 50, 0));
                        return Promise.resolve();
                    },
                },
            ],
        });
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        character.update(deltaSeconds);
        roverControls.update(deltaSeconds);
        interactionSystem.update(deltaSeconds);
        interactionLayer.update(deltaSeconds);

        if (scene.activeCamera !== activeControls.getActiveCamera()) {
            if (scene.activeCamera !== null) {
                scene.activeCamera.detachControl();
            }
            scene.activeCamera = activeControls.getActiveCamera();
            scene.activeCamera.attachControl();
        }
    });

    return scene;
}
