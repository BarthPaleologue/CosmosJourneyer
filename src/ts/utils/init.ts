import { Engine } from "@babylonjs/core";
import { UberScene } from "../core/uberScene";

export function initEngineScene(canvas: HTMLCanvasElement): [Engine, UberScene] {
    const engine = new Engine(canvas, false, {
        //useHighPrecisionFloats: true,
        //useHighPrecisionMatrix: true,
        //adaptToDeviceRatio: true,
    });
    engine.loadingScreen.displayLoadingUI();

    console.log("GPU utilisé : " + engine.getGlInfo().renderer);

    const scene = new UberScene(engine);

    return [engine, scene];
}
