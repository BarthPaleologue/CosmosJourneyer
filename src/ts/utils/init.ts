import { Engine, EngineFactory, WebGPUEngine } from "@babylonjs/core";
import { UberScene } from "../core/uberScene";

export async function initEngineScene(canvas: HTMLCanvasElement): Promise<[Engine, UberScene]> {
    const engine = await EngineFactory.CreateAsync(canvas, {
        antialias: false
        //useHighPrecisionFloats: true,
        //useHighPrecisionMatrix: true,
        //adaptToDeviceRatio: true,
    });

    engine.loadingScreen.displayLoadingUI();

    console.log(`API: ${engine instanceof WebGPUEngine ? "WebGPU" : "WebGL" + engine.webGLVersion}`);
    console.log(`GPU detected: ${engine.getGlInfo().renderer}`);

    const scene = new UberScene(engine);

    return [engine, scene];
}
