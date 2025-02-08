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
import { Scene, Tools } from "@babylonjs/core";
import { createOrbitalDemoScene } from "./playgrounds/orbitalDemo";
import { createAutomaticLandingScene } from "./playgrounds/automaticLanding";
import { createHyperspaceTunnelDemo } from "./playgrounds/hyperspaceTunnel";
import { createDebugAssetsScene } from "./playgrounds/debugAssets";
import { createSpaceStationScene } from "./playgrounds/spaceStation";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const urlParams = new URLSearchParams(window.location.search);
const requestedScene = urlParams.get("scene") ?? "";

let scene: Scene;
switch (requestedScene) {
    case "orbitalDemo":
        scene = createOrbitalDemoScene(engine);
        break;
    case "tunnel":
        scene = await createHyperspaceTunnelDemo(engine);
        break;
    case "automaticLanding":
        scene = await createAutomaticLandingScene(engine);
        break;
    case "debugAssets":
        scene = await createDebugAssetsScene(engine);
        break;
    case "spaceStation":
        scene = await createSpaceStationScene(engine);
        break;
    default:
        scene = await createAutomaticLandingScene(engine);
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
