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
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { computeRingRotationPeriod } from "./utils/ringRotation";
import { Settings } from "./settings";
import { sigmoid } from "./utils/math";
import { StarfieldPostProcess } from "./postProcesses/starfieldPostProcess";
import { AttachmentType, SpaceStationNode, SpaceStationNodeType } from "./proceduralAssets/spaceStation/spaceStationNode";
/*import { ShipControls } from "./spaceship/shipControls";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";*/

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

/*const havokInstance = await HavokPhysics();
console.log(`Havok initialized`);
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(Vector3.Zero(), havokPlugin);*/

await Assets.Init(scene);

const defaultControls = new DefaultControls(scene);
defaultControls.speed = 2000;

const camera = defaultControls.getActiveCameras()[0];
camera.maxZ = 100e3;
camera.attachControl(canvas, true);

scene.enableDepthRenderer(camera, false, true);

defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
defaultControls.getTransform().lookAt(Vector3.Zero());

const starfieldPostProcess = new StarfieldPostProcess(scene, [], [], Quaternion.Identity());
camera.attachPostProcess(starfieldPostProcess);

let lastNode: SpaceStationNode | null = null;
let firstNode: SpaceStationNode | null = null;

let urgeToCreateHabitat = 0;
for (let i = 0; i < 30; i++) {
    let nodeType = SpaceStationNodeType.SQUARE_SECTION;
    if (Math.random() < sigmoid(urgeToCreateHabitat - 6) && urgeToCreateHabitat > 0) {
        nodeType = Math.random() < 0.5 ? SpaceStationNodeType.RING_HABITAT : SpaceStationNodeType.HELIX_HABITAT;
    }

    const newNode: SpaceStationNode = new SpaceStationNode(lastNode, nodeType, AttachmentType.NEXT);
    if (i === 0) firstNode = newNode;

    switch (nodeType) {
        case SpaceStationNodeType.SQUARE_SECTION:
            urgeToCreateHabitat += 1;
            break;
        case SpaceStationNodeType.HELIX_HABITAT:
        case SpaceStationNodeType.RING_HABITAT:
            urgeToCreateHabitat = 0;
            break;
    }

    if (nodeType === SpaceStationNodeType.SQUARE_SECTION && Math.random() < 0.4) {
        const sideNode1 = new SpaceStationNode(newNode, SpaceStationNodeType.SOLAR_PANEL, AttachmentType.SIDE);
        newNode.sideNodes.push(sideNode1);

        const sideNode2 = new SpaceStationNode(newNode, SpaceStationNodeType.SOLAR_PANEL, AttachmentType.SIDE);
        newNode.sideNodes.push(sideNode2);
        sideNode2.mesh.rotateAround(newNode.mesh.position, Axis.Y, Math.PI);
    } else if (nodeType === SpaceStationNodeType.SQUARE_SECTION && Math.random() < 0.3) {
        for(let ring = -2; ring < 2; ring++) {
            for (let sideIndex = 0; sideIndex < 4; sideIndex++) {
                const tank = new SpaceStationNode(newNode, SpaceStationNodeType.SPHERICAL_TANK, AttachmentType.SIDE);
                newNode.sideNodes.push(tank);
                tank.mesh.rotateAround(newNode.mesh.position, Axis.Y, (Math.PI / 2) * sideIndex);
                tank.mesh.translate(Axis.Y, ring * 40);
            }
        }
    }

    lastNode = newNode;
}

function updateStation(stationNode: SpaceStationNode | null, deltaSeconds: number) {
    if (stationNode === null) return;

    if (stationNode.type === SpaceStationNodeType.RING_HABITAT || stationNode.type === SpaceStationNodeType.HELIX_HABITAT) {
        stationNode.mesh.rotate(Axis.Y, ((stationNode.index % 2 === 0 ? -1 : 1) * deltaSeconds) / computeRingRotationPeriod(stationNode.mesh.scalingDeterminant, Settings.G_EARTH));
    }

    updateStation(stationNode.next, deltaSeconds);
    stationNode.sideNodes.forEach((sideNode) => updateStation(sideNode, deltaSeconds));
}

const light = new HemisphericLight("Sun", Vector3.Up(), scene);

scene.onBeforeRenderObservable.add(() => {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    defaultControls.update(deltaSeconds);

    updateStation(firstNode, deltaSeconds);
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
