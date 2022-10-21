import { UberScene } from "../../core/uberScene";
import { UberRenderingPipeline } from "./uberRenderingPipeline";
import { Engine, PostProcess, PostProcessRenderEffect } from "@babylonjs/core";

export class PostProcessManager {
    engine: Engine;
    scene: UberScene;
    uberRenderingPipeline: UberRenderingPipeline;

    readonly starFields: PostProcess[] = [];
    readonly volumetricLights: PostProcess[] = [];
    readonly oceans: PostProcess[] = [];
    readonly clouds: PostProcess[] = [];
    readonly atmospheres: PostProcess[] = [];
    readonly rings: PostProcess[] = [];
    readonly blackHoles: PostProcess[] = [];
    readonly overlays: PostProcess[] = [];
    readonly colorCorrections: PostProcess[] = [];
    readonly fxaas: PostProcess[] = [];

    readonly starFieldRenderEffect: PostProcessRenderEffect;
    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    readonly overlayRenderEffect: PostProcessRenderEffect;
    readonly fxaaRenderEffect: PostProcessRenderEffect;

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();
        this.uberRenderingPipeline = scene.uberRenderingPipeline;

        this.starFieldRenderEffect = new PostProcessRenderEffect(this.engine, "starFieldRenderEffect", () => {
            return this.starFields;
        });

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(this.engine, "colorCorrectionRenderEffect", () => {
            return this.colorCorrections;
        });

        this.overlayRenderEffect = new PostProcessRenderEffect(this.engine, "overlayRenderEffect", () => {
            return this.overlays;
        });

        this.fxaaRenderEffect = new PostProcessRenderEffect(this.engine, "fxaaRenderEffect", () => {
            return this.fxaas;
        });
    }
}