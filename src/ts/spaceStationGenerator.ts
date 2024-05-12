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
import { Axis, Scene } from "@babylonjs/core";
import { Assets } from "./assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SpaceStationAssets } from "./proceduralAssets/spaceStation/spaceStationAssets";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { computeRingRotationPeriod } from "./utils/ringRotation";
import { Settings } from "./settings";
import { sigmoid } from "./utils/math";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 2000;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
defaultControls.getTransform().lookAt(Vector3.Zero());

await Assets.Init(scene);

const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
camera.attachPostProcess(starfieldPostProcess);

const enum SpaceStationNodeType {
    SQUARE_SECTION,
    RING_HABITAT
}

class SpaceStationNode {
    type: SpaceStationNodeType;
    mesh: AbstractMesh;
    previous: SpaceStationNode | null;
    sideNodes: SpaceStationNode[];

    constructor(previous: SpaceStationNode | null, type: SpaceStationNodeType) {
        this.type = type;
        this.previous = previous;
        this.sideNodes = [];

        switch (type) {
            case SpaceStationNodeType.SQUARE_SECTION:
                this.mesh = SpaceStationAssets.SQUARE_SECTION.createInstance("SquareSection");
                this.mesh.scalingDeterminant = 0.9 + Math.random() * 0.2;
                this.mesh.scaling.y = 5;
                break;
            case SpaceStationNodeType.RING_HABITAT:
                this.mesh = SpaceStationAssets.RING_HABITAT.createInstance("RingHabitat");
                this.mesh.scalingDeterminant = 1e3 + (Math.random() - 0.5) * 1e3;
        }

        if (previous !== null) {
            const previousSectionSizeY = previous.mesh.getBoundingInfo().boundingBox.extendSize.y * previous.mesh.scalingDeterminant * previous.mesh.scaling.y;
            const newSectionY = this.mesh.getBoundingInfo().boundingBox.extendSize.y * this.mesh.scalingDeterminant * this.mesh.scaling.y;

            this.mesh.position = previous.mesh.position.add(previous.mesh.up.scale(previousSectionSizeY + newSectionY));
        }
    }
}

const sections: SpaceStationNode[] = [];

let urgeToCreateHabitat = 0;
for (let i = 0; i < 30; i++) {
    let sectionType = SpaceStationNodeType.SQUARE_SECTION;
    if (Math.random() < sigmoid(urgeToCreateHabitat - 6) && urgeToCreateHabitat > 0) sectionType = SpaceStationNodeType.RING_HABITAT;

    const section = new SpaceStationNode(sections[sections.length - 1] ?? null, sectionType);

    switch (sectionType) {
        case SpaceStationNodeType.SQUARE_SECTION:
            urgeToCreateHabitat += 1;
            break;
        case SpaceStationNodeType.RING_HABITAT:
            scene.onBeforeRenderObservable.add(() => {
                if (section === null) return;
                section.mesh.rotate(Axis.Y, ((i % 2 === 0 ? -1 : 1) * engine.getDeltaTime()) / 1000 / computeRingRotationPeriod(section.mesh.scalingDeterminant, Settings.G_EARTH));
            });
            urgeToCreateHabitat = 0;
            break;
    }

    sections.push(section);
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
