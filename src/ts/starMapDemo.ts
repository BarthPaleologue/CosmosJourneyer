import { Tools } from "@babylonjs/core";

import { Mouse } from "./inputs/mouse";

import "../styles/index.scss";

import { initEngineScene } from "./utils/init";
import { Assets } from "./assets";
import { StarMap } from "./starmap/starMap";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const [engine, _] = await initEngineScene(canvas);

const starMap = new StarMap(engine);

Assets.Init(starMap.scene).then(() => {
    const mouse = new Mouse(canvas, 50);
    starMap.controller.inputs.push(mouse);

    document.addEventListener("keydown", (e) => {
        if (e.key == "p") Tools.CreateScreenshotUsingRenderTarget(engine, starMap.controller.getActiveCamera(), { precision: 4 });
        if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
    });

    starMap.scene.executeWhenReady(() => {
        engine.loadingScreen.hideLoadingUI();
        engine.runRenderLoop(() => starMap.scene.render());
    });
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});
