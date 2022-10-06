import { Engine, WebGPUEngine } from "@babylonjs/core";
import { UberScene } from "../core/uberScene";

export async function initEngineScene(canvas: HTMLCanvasElement): Promise<[Engine, UberScene]> {
    const engine = !("gpu" in navigator) ? new Engine(canvas, false, {
        //useHighPrecisionFloats: true,
        //useHighPrecisionMatrix: true,
        //adaptToDeviceRatio: true,
    }) : new WebGPUEngine(canvas);

    if("gpu" in navigator) await (engine as WebGPUEngine).initAsync();

    engine.loadingScreen.displayLoadingUI();

    console.log("GPU utilisé : " + engine.getGlInfo().renderer);

    const scene = new UberScene(engine);

    return [engine, scene];
}
