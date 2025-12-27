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
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { HumanoidAvatar } from "@/frontend/controls/characterControls/humanoidAvatar";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { radialChoiceModal } from "@/frontend/ui/dialogModal/radialChoiceModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";
import { createSquareMatrixBuffer } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/matrixBuffer";
import { ThinInstancePatch } from "@/frontend/universe/planets/telluricPlanet/terrain/instancePatch/thinInstancePatch";

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

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const light = new DirectionalLight("sun", new Vector3(1, -1, -1), scene);

    createSky(light.direction.negate(), scene);

    const hemi = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const groundSize = 64;
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

    const grassPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), groundSize, 512, wrappedRng));
    grassPatch.createInstances([{ mesh: grassBladeMesh, distance: 0 }]);
    grassPatch.getCurrentMesh().parent = ground;

    const butterflyMesh = createButterfly(scene);
    butterflyMesh.isVisible = false;

    const butterflyMaterial = new ButterflyMaterial(assets.textures.particles.butterfly, scene);
    butterflyMesh.material = butterflyMaterial.get();

    const butterflyPatch = new ThinInstancePatch(createSquareMatrixBuffer(Vector3.Zero(), groundSize, 64, wrappedRng));
    butterflyPatch.createInstances([{ mesh: butterflyMesh, distance: 0 }]);

    new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, restitution: 0.2 }, scene);

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

    scene.onBeforeRenderObservable.add(() => {
        if (characterControls.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = characterControls.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;
        characterControls.update(deltaSeconds);
        interactionSystem.update(deltaSeconds);
        interactionLayer.update(deltaSeconds);
    });

    return scene;
}
