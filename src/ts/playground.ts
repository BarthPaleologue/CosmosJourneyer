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

import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import { PhysicsViewer, Scene, Tools } from "@babylonjs/core";
import "@babylonjs/inspector";
import { createDefaultScene } from "./playgrounds/default";
import { createOrbitalDemoScene } from "./playgrounds/orbitalDemo";
import { createAutomaticLandingScene } from "./playgrounds/automaticLanding";
import { createHyperspaceTunnelDemo } from "./playgrounds/hyperspaceTunnel";
import { createDebugAssetsScene } from "./playgrounds/debugAssets";
import { createSpaceStationScene } from "./playgrounds/spaceStation";
import { createXrScene } from "./playgrounds/xr";
import { createFlightDemoScene } from "./playgrounds/flightDemo";
import { createNeutronStarScene } from "./playgrounds/neutronStar";
import { createCharacterDemoScene } from "./playgrounds/character";
import { createSpaceStationUIScene } from "./playgrounds/spaceStationUI";
import { createStarMapScene } from "./playgrounds/starMap";
import { createTutorialScene } from "./playgrounds/tutorial";
import { createAsteroidFieldScene } from "./playgrounds/asteroidField";
import { LoadingScreen } from "./uberCore/loadingScreen";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const loadingScreen = new LoadingScreen(canvas);
const progressCallback = (progress01: number, text: string) => {
    loadingScreen.setProgressPercentage(progress01 * 100);
    loadingScreen.loadingUIText = text;
};

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.loadingScreen = loadingScreen;
engine.displayLoadingUI();

const urlParams = new URLSearchParams(window.location.search);
const requestedScene = urlParams.get("scene") ?? "";

let scene: Scene;
switch (requestedScene) {
    case "orbitalDemo":
        scene = createOrbitalDemoScene(engine, progressCallback);
        break;
    case "tunnel":
        scene = await createHyperspaceTunnelDemo(engine, progressCallback);
        break;
    case "automaticLanding":
        scene = await createAutomaticLandingScene(engine, progressCallback);
        break;
    case "debugAssets":
        scene = await createDebugAssetsScene(engine, progressCallback);
        break;
    case "spaceStation":
        scene = await createSpaceStationScene(engine, progressCallback);
        break;
    case "spaceStationUI":
        scene = await createSpaceStationUIScene(engine, progressCallback);
        break;
    case "xr":
        scene = await createXrScene(engine, progressCallback);
        break;
    case "flightDemo":
        scene = await createFlightDemoScene(engine, progressCallback);
        break;
    case "neutronStar":
        scene = await createNeutronStarScene(engine, progressCallback);
        break;
    case "character":
        scene = await createCharacterDemoScene(engine, progressCallback);
        break;
    case "starMap":
        scene = await createStarMapScene(engine, progressCallback);
        break;
    case "tutorial":
        scene = await createTutorialScene(engine, progressCallback);
        break;
    case "asteroidField":
        scene = await createAsteroidFieldScene(engine, progressCallback);
        break;
    default:
        scene = createDefaultScene(engine, progressCallback);
}

if (urlParams.get("debug") !== null) {
    const inspectorRoot = document.createElement("div");
    document.body.appendChild(inspectorRoot);
    inspectorRoot.id = "inspectorLayer";
    await scene.debugLayer.show({
        globalRoot: inspectorRoot
    });
}

if (urlParams.get("physicsViewer") !== null) {
    const physicsViewer = new PhysicsViewer(scene);
    scene.onBeforeRenderObservable.add(() => {
        for (const mesh of scene.meshes) {
            const physicsBody = mesh.physicsBody;
            if (physicsBody === null || physicsBody === undefined) {
                continue;
            }

            physicsViewer.showBody(physicsBody);
        }
    });
}

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
        if (scene.activeCamera === null) {
            return;
        }
        Tools.CreateScreenshot(engine, scene.activeCamera, { precision: 1 });
    }
});
