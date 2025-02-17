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

import { Scene, Tools, WebGPUEngine } from "@babylonjs/core";
import { createOrbitalDemoScene } from "./playgrounds/orbitalDemo";
import { createAutomaticLandingScene } from "./playgrounds/automaticLanding";
import { createHyperspaceTunnelDemo } from "./playgrounds/hyperspaceTunnel";
import { createDebugAssetsScene } from "./playgrounds/debugAssets";
import { createSpaceStationScene } from "./playgrounds/spaceStation";
import { createXrScene } from "./playgrounds/xr";
import { createFlightDemoScene } from "./playgrounds/flightDemo";
import { createNeutronStarScene } from "./playgrounds/neutronStar";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas, {
    antialias: true,
    audioEngine: true,
    useHighPrecisionMatrix: true,
    doNotHandleContextLost: true
});

await engine.initAsync(undefined, {
    wasmPath: new URL("./utils/TWGSL/twgsl.wasm", import.meta.url).href,
    jsPath: new URL("./utils/TWGSL/twgsl.js", import.meta.url).href
});

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
    case "xr":
        scene = await createXrScene(engine);
        break;
    case "flightDemo":
        scene = await createFlightDemoScene(engine);
        break;
    case "neutronStar":
        scene = await createNeutronStarScene(engine);
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
