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
    AbstractMesh,
    CascadedShadowGenerator,
    Color3,
    DirectionalLight,
    HemisphericLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadCharacters } from "@/frontend/assets/objects/characters";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { InteractionSystem } from "@/frontend/inputs/interaction/interactionSystem";
import { radialChoiceModal } from "@/frontend/ui/dialogModal";
import { InteractionLayer } from "@/frontend/ui/interactionLayer";

import { initI18n } from "@/i18n";
import { CollisionMask } from "@/settings";

import { createSky, enablePhysics } from "./utils";

export async function createInteractionDemo(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await initI18n();

    await enablePhysics(scene, new Vector3(0, -9.81, 0));

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const characters = await loadCharacters(scene, progressMonitor);

    const light = new DirectionalLight("dir01", new Vector3(0, -1, -1), scene);
    light.autoCalcShadowZBounds = true;

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
    ground.receiveShadows = true;

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    groundAggregate.shape.material.friction = 2;

    const characterObject = characters.default.instantiateHierarchy(null);
    if (!(characterObject instanceof AbstractMesh)) {
        throw new Error("Character object is null");
    }

    const character = new CharacterControls(characterObject, scene);
    character.getActiveCamera().attachControl();

    CharacterInputs.setEnabled(true);

    const shadowGenerator = new CascadedShadowGenerator(2048, light);
    shadowGenerator.transparencyShadow = true;
    shadowGenerator.autoCalcDepthBounds = true;
    shadowGenerator.stabilizeCascades = true;
    shadowGenerator.shadowMaxZ = groundSize * 4;

    const depthRenderer = scene.enableDepthRenderer(null, false, true);
    scene.onBeforeCameraRenderObservable.add((camera) => {
        depthRenderer.getDepthMap().activeCamera = camera;
        shadowGenerator.setDepthRenderer(depthRenderer);
    });

    shadowGenerator.addShadowCaster(character.character);

    const interactableMembership = 0x1 << 5;

    const soundPlayer = new SoundPlayerMock();

    const interactionSystem = new InteractionSystem(interactableMembership, scene, async (interactions) => {
        console.log("performing choice");
        const hasPointerLock = engine.isPointerLock;
        if (hasPointerLock) {
            document.exitPointerLock();
        }
        const choice = await radialChoiceModal(interactions, (interaction) => interaction.label, soundPlayer);
        if (hasPointerLock) {
            await engine.getRenderingCanvas()?.requestPointerLock();
        }
        console.log("chosen");
        return choice;
    });

    const interactionLayer = new InteractionLayer(interactionSystem);
    document.body.appendChild(interactionLayer.root);

    //spawn a bunch of boxes
    for (let i = 0; i < 200; i++) {
        const size = 0.2 + Math.random();
        const box = MeshBuilder.CreateBox(`box${i}`, { size }, scene);
        box.position = new Vector3((Math.random() - 0.5) * groundSize, size / 2, (Math.random() - 0.5) * groundSize);
        box.rotation.y = Math.random();

        const boxMaterial = new PBRMaterial("boxMaterial", scene);
        boxMaterial.albedoColor = Color3.Random();
        boxMaterial.metallic = 0;
        boxMaterial.roughness = 0.7;
        box.material = boxMaterial;

        shadowGenerator.addShadowCaster(box);

        const boxAggregate = new PhysicsAggregate(
            box,
            PhysicsShapeType.BOX,
            { mass: 50, restitution: 0.3, friction: 1 },
            scene,
        );
        boxAggregate.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;

        interactionSystem.register({ body: boxAggregate.body, shape: boxAggregate.shape }, () => [
            {
                label: "push",
                perform: () => {
                    const cameraRay = scene.activeCamera?.getForwardRay(
                        1,
                        scene.activeCamera.getWorldMatrix(),
                        scene.activeCamera.getWorldMatrix().getTranslation(),
                    );
                    if (cameraRay === undefined) {
                        return;
                    }

                    boxAggregate.body.applyImpulse(
                        cameraRay.direction.scale(200).add(Vector3.Up().scale(200)),
                        boxAggregate.body.getObjectCenterWorld(),
                    );
                    boxAggregate.body.applyAngularImpulse(
                        new Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10),
                    );
                },
            },
            {
                label: "spin",
                perform: () => {
                    boxAggregate.body.applyAngularImpulse(new Vector3(0, 50, 0));
                },
            },
            {
                label: "change color",
                perform: () => {
                    box.material = new PBRMaterial("boxMaterial", scene);
                    (box.material as PBRMaterial).albedoColor = Color3.Random();
                    (box.material as PBRMaterial).metallic = 0;
                    (box.material as PBRMaterial).roughness = 0.7;
                },
            },
            {
                label: "delete",
                perform: () => {
                    box.dispose();
                },
            },
            {
                label: "nothing",
                perform: () => {
                    // do nothing
                },
            },
        ]);
    }

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        interactionSystem.update(deltaSeconds);

        if (character.getActiveCamera() !== scene.activeCamera) {
            scene.activeCamera?.detachControl();

            const camera = character.getActiveCamera();
            camera.attachControl();
            scene.activeCamera = camera;
        }

        character.update(deltaSeconds);
    });

    return scene;
}
