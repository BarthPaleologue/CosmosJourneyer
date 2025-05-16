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

import { Color3, MeshBuilder, PBRMetallicRoughnessMaterial, SolidParticle, SolidParticleSystem } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";

import { enablePhysics } from "./utils";

export async function createFlightDemoScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "crosshair";

    await enablePhysics(scene);

    const assets = await loadRenderingAssets((loadedCount, totalCount, name) => {
        progressCallback(loadedCount / totalCount, `Loading ${name}`);
    }, scene);

    const soundPlayer = new SoundPlayerMock();
    const tts = new TtsMock();

    const ship = ShipControls.CreateDefault(scene, assets, tts, soundPlayer);

    const camera = ship.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    scene.activeCamera = camera;

    SpaceShipControlsInputs.setEnabled(true);

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 1.0;

    // Shape to follow
    const box = MeshBuilder.CreateBox("box", { size: 50 }, scene);

    //create solid particle system of stationery grey boxes to show movement of box and camera
    const boxesSPS = new SolidParticleSystem("boxes", scene, { updatable: false });

    const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const range = 5e3;

    //add 400 boxes
    boxesSPS.addShape(box, 10_000, {
        positionFunction: (particle: SolidParticle) => {
            particle.position = new Vector3(randRange(-1, 1), randRange(-1, 1), randRange(-1, 1)).scaleInPlace(range);
        },
    });

    const mesh = boxesSPS.buildMesh();

    const material = new PBRMetallicRoughnessMaterial("material", scene);
    material.baseColor = new Color3(0.5, 0.5, 0.5);
    material.metallic = 0.0;
    material.roughness = 0.5;

    mesh.material = material;

    box.setEnabled(false);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        ship.update(deltaSeconds);
    });

    return scene;
}
