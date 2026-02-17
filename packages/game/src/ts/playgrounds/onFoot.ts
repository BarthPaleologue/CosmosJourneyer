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
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Quaternion,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { seededSquirrelNoise } from "squirrel-noise";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadHumanoidPrefabs } from "@/frontend/assets/objects/humanoids";
import { createButterfly } from "@/frontend/assets/procedural/butterfly/butterfly";
import { ButterflyMaterial } from "@/frontend/assets/procedural/butterfly/butterflyMaterial";
import { createGrassBlade } from "@/frontend/assets/procedural/grass/grassBlade";
import { GrassMaterial } from "@/frontend/assets/procedural/grass/grassMaterial";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import type { Controls } from "@/frontend/controls";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { radialChoiceModal } from "@/frontend/ui/dialogModal/radialChoiceModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";
import { createSquareMatrixBuffer } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/matrixBuffer";
import { ThinInstancePatch } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/thinInstancePatch";
import { VehicleControls } from "@/frontend/vehicle/vehicleControls";
import { VehicleInputs } from "@/frontend/vehicle/vehicleControlsInputs";
import { createWolfMk2 } from "@/frontend/vehicle/worlfMk2";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";

import { CollisionMask } from "@/settings";

import { createSky, enablePhysics } from "./utils";

export async function createOnFootScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const physicsEngine = await enablePhysics(scene, new Vector3(0, -9.81, 0));

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const light = new DirectionalLight("sun", new Vector3(1, -1, -1), scene);

    createSky(light.direction.negate(), scene);

    const hemi = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const groundSize = 4096;
    const ground = MeshBuilder.CreateGround(
        "ground",
        {
            width: groundSize,
            height: groundSize,
            subdivisions: 4,
        },
        scene,
    );

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor = Color3.FromHexString("#0C4909").scale(0.5);
    groundMaterial.metallic = 0.0;
    groundMaterial.roughness = 0.8;
    groundMaterial.backFaceCulling = false;
    ground.material = groundMaterial;

    const grassBladeMesh = createGrassBlade(scene, 5);
    grassBladeMesh.isVisible = false;

    const grassMaterial = new GrassMaterial(assets.textures.noises.seamlessPerlin, scene);
    grassBladeMesh.material = grassMaterial.get();

    const rng = seededSquirrelNoise(0);
    let rngState = 0;
    const wrappedRng = () => {
        return rng(rngState++);
    };

    const grassPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), 128, 128 * 6, wrappedRng));
    grassPatch.createInstances([{ mesh: grassBladeMesh, distance: 0 }]);
    grassPatch.getCurrentMesh().parent = ground;

    const butterflyMesh = createButterfly(scene);
    butterflyMesh.isVisible = false;

    const butterflyMaterial = new ButterflyMaterial(assets.textures.particles.butterfly, scene);
    butterflyMesh.material = butterflyMaterial.get();

    const butterflyPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), 128, 128, wrappedRng));
    butterflyPatch.createInstances([{ mesh: butterflyMesh, distance: 0 }]);

    const groundAggregate = new PhysicsAggregate(
        ground,
        PhysicsShapeType.BOX,
        { mass: 0, restitution: 0.2, friction: 2 },
        scene,
    );
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;

    const humanoids = await loadHumanoidPrefabs(scene, progressMonitor);

    const humanoidInstance = humanoids.placeholder.spawn();
    if (!humanoidInstance.success) {
        throw new Error(`Failed to instantiate character: ${humanoidInstance.error}`);
    }

    const humanoidAvatar = new HumanoidAvatar(humanoidInstance.value, physicsEngine, scene);
    const characterControls = new CharacterControls(humanoidAvatar, scene);
    characterControls.firstPersonCamera.minZ = 0.1;
    characterControls.firstPersonCamera.attachControl();
    CharacterInputs.setEnabled(true);

    const soundPlayer = new SoundPlayerMock();
    const spaceship = await Spaceship.CreateDefault(scene, assets, soundPlayer);
    spaceship.getTransform().position.copyFromFloats(16, 5, 16);

    const tts = new TtsMock();
    const notificationManager = new NotificationManagerMock();
    const shipControls = new ShipControls(spaceship, scene, soundPlayer, tts, notificationManager);

    const roverResult = createWolfMk2(
        assets,
        scene,
        new Vector3(-16, 3, 16),
        Quaternion.RotationAxis(Vector3.UpReadOnly, 0.5),
    );
    if (!roverResult.success) {
        throw new Error(`Failed to create rover: ${roverResult.error}`);
    }

    const rover = roverResult.value;

    const roverControls = new VehicleControls(scene);
    roverControls.firstPersonCamera.minZ = 0.1;
    roverControls.setVehicle(rover);

    let activeControls: Controls = characterControls;

    const setActiveControls = async (controls: Controls) => {
        scene.activeCamera?.detachControl();

        activeControls = controls;
        activeControls.getActiveCamera().attachControl();
        scene.activeCamera = activeControls.getActiveCamera();

        if (engine.isPointerLock && !activeControls.shouldLockPointer()) {
            document.exitPointerLock();
        } else if (!engine.isPointerLock && activeControls.shouldLockPointer()) {
            await engine.getRenderingCanvas()?.requestPointerLock();
        }
    };

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        if (activeControls.shouldLockPointer()) {
            await engine.getRenderingCanvas()?.requestPointerLock();
        }
    });

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

    const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();
    const interactionLayer = new InteractionLayer(interactionSystem, keyboardLayoutMap);
    document.body.appendChild(interactionLayer.root);

    interactionSystem.register({
        getPhysicsAggregate: () => spaceship.aggregate,
        getInteractions: () => [
            {
                label: "Pilot",
                perform: async () => {
                    await setActiveControls(shipControls);
                    CharacterInputs.setEnabled(false);
                    SpaceShipControlsInputs.setEnabled(true);
                },
            },
        ],
    });

    interactionSystem.register({
        getPhysicsAggregate: () => roverResult.value.frame,
        getInteractions: () => [
            {
                label: "Drive",
                perform: async () => {
                    await setActiveControls(roverControls);
                    CharacterInputs.setEnabled(false);
                    VehicleInputs.setEnabled(true);
                },
            },
        ],
    });

    for (const door of rover.doors) {
        interactionSystem.register(door);
    }

    document.addEventListener("keydown", async (e) => {
        if (e.key === "e") {
            await setActiveControls(characterControls);
            CharacterInputs.setEnabled(true);
            VehicleInputs.setEnabled(false);
            SpaceShipControlsInputs.setEnabled(false);
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (activeControls.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = activeControls.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        characterControls.update(deltaSeconds);
        roverControls.update(deltaSeconds);
        shipControls.update(deltaSeconds);
        interactionSystem.update(deltaSeconds);
        interactionLayer.update(deltaSeconds);
    });

    return scene;
}
