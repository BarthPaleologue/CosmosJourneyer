import { Engine, Scene } from "@babylonjs/core";

export function initEngineScene(canvas: HTMLCanvasElement): [Engine, Scene] {
    const engine = new Engine(canvas);
    engine.loadingScreen.displayLoadingUI();

    console.log("GPU utilisé : " + engine.getGlInfo().renderer);

    const scene = new Scene(engine);

    return [engine, scene];
}
