//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { Scene } from "@babylonjs/core";
import { Assets } from "./assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SpaceStationAssets } from "./proceduralAssets/spaceStation/spaceStationAssets";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 20;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100_000e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 20, -30));
defaultControls.getTransform().lookAt(Vector3.Zero());

await Assets.Init(scene);

const sections: InstancedMesh[] = [];

function addSection(newSection: InstancedMesh, previousSections: InstancedMesh[]) {7
    if(previousSections.length > 0) {
        const lastSection = previousSections[previousSections.length - 1];

        const lastSectionSizeY = lastSection.getBoundingInfo().boundingBox.extendSize.y * lastSection.scalingDeterminant * lastSection.scaling.y;
        const newSectionY = newSection.getBoundingInfo().boundingBox.extendSize.y * newSection.scalingDeterminant * newSection.scaling.y;

        newSection.position = lastSection.position.add(lastSection.up.scale(lastSectionSizeY + newSectionY + 1));
    }

    previousSections.push(newSection);
}

for(let i = 0; i < 6; i++) {
    const section = Math.random() < 0.5 ?
        SpaceStationAssets.SQUARE_SECTION.createInstance("SquareSection" + i):
        SpaceStationAssets.RING_HABITAT.createInstance("RingHabitat" + i);
    section.scalingDeterminant = 0.5 + Math.random();
    addSection(section, sections);
}

const light = new HemisphericLight("Sun", Vector3.Up(), scene);

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    defaultControls.update(deltaSeconds);

});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});

document.addEventListener("keypress", (e) => {
    if (e.key === "p") {
        // take screenshot
        Tools.CreateScreenshot(engine, camera, { precision: 1 });
    }
});
