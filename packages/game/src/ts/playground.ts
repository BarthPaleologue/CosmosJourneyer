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

import "@styles/index.scss";
import "@babylonjs/inspector";
import "@babylonjs/node-editor";

import { Engine, PhysicsViewer, Tools, type Scene } from "@babylonjs/core";

import { LoadingScreen } from "@/frontend/helpers/loadingScreen";

import { LoadingProgressMonitor } from "./frontend/assets/loadingProgressMonitor";
import { PlaygroundRegistry } from "./playgrounds/playgroundRegistry";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const loadingScreen = new LoadingScreen(canvas);

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.loadingScreen = loadingScreen;
engine.displayLoadingUI();

const urlParams = new URLSearchParams(window.location.search);
const requestedScene = urlParams.get("scene") ?? "";

const playgroundRegistry = new PlaygroundRegistry();

const sceneBuilder = playgroundRegistry.get(requestedScene);

const loadingProgressMonitor = new LoadingProgressMonitor();
loadingProgressMonitor.addProgressCallback((startedTaskCount, completedTaskCount) => {
    loadingScreen.setProgress(startedTaskCount, completedTaskCount);
    loadingScreen.loadingUIText = `Loading ${requestedScene} (${completedTaskCount}/${startedTaskCount})`;
});

loadingProgressMonitor.startTask();
const scene = await sceneBuilder(engine, loadingProgressMonitor);
window.scene = scene;
loadingProgressMonitor.completeTask();

if (urlParams.get("debug") !== null) {
    const inspectorRoot = document.createElement("div");
    document.body.appendChild(inspectorRoot);
    inspectorRoot.id = "inspectorLayer";
    await scene.debugLayer.show({
        globalRoot: inspectorRoot,
    });
}

if (urlParams.get("physicsViewer") !== null) {
    const physicsViewer = new PhysicsViewer(scene);
    scene.onBeforeRenderObservable.add(() => {
        for (const mesh of scene.meshes) {
            const physicsBody = mesh.physicsBody;
            if (!physicsBody) {
                continue;
            }

            physicsViewer.showBody(physicsBody);
        }
    });
}

const maxFrameCounter = urlParams.get("freeze");
const maxFrameCounterValue = Number(maxFrameCounter);
if (maxFrameCounter !== null && !isNaN(maxFrameCounterValue)) {
    engine["getDeltaTime"] = () => 0; // Disable delta time to freeze the scene
    let frameCounter = 0;
    scene.onAfterRenderObservable.add(() => {
        frameCounter++;
        if (frameCounter >= maxFrameCounterValue) {
            engine.stopRenderLoop();
            canvas.dataset["frozen"] = "1";
            return;
        }
    });
}

scene.onAfterRenderObservable.addOnce(() => {
    canvas.dataset["ready"] = "1";
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
        if (scene.activeCamera === null) {
            return;
        }
        Tools.CreateScreenshot(engine, scene.activeCamera, { precision: 1 });
    }
});

// Make the scene available in the browser console
declare global {
    interface Window {
        scene: Scene;
    }
}

window.scene = scene;
