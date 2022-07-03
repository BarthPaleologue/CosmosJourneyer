import {
    Camera,
    Engine, FxaaPostProcess,
    PostProcessRenderEffect,
    PostProcessRenderPipeline,
    Scene, Texture,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";
import { StarfieldPostProcess } from "./starfieldPostProcess";
import { FlatCloudsPostProcess } from "./planetPostProcesses/flatCloudsPostProcess";
import { AtmosphericScatteringPostProcess } from "./planetPostProcesses/atmosphericScatteringPostProcess";
import { RingsPostProcess } from "./planetPostProcesses/ringsPostProcess";
import { OceanPostProcess } from "./planetPostProcesses/oceanPostProcess";

export class SpaceRenderingPipeline extends PostProcessRenderPipeline {
    readonly scene: Scene;
    readonly engine: Engine;

    readonly starfields: StarfieldPostProcess[] = [];
    readonly volumetricLights: VolumetricLightScatteringPostProcess[] = [];
    readonly oceans: OceanPostProcess[] = [];
    readonly clouds: FlatCloudsPostProcess[] = [];
    readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    readonly rings: RingsPostProcess[] = [];

    constructor(name: string, scene: Scene) {
        super(scene.getEngine(), name);
        this.scene = scene;
        this.engine = this.scene.getEngine();
        this.scene.postProcessRenderPipelineManager.addPipeline(this);
    }

    init() {
        const starfieldRenderEffect = new PostProcessRenderEffect(this.engine, "starfieldRenderEffect", () => {
            return this.starfields;
        });

        const vlsRenderEffect = new PostProcessRenderEffect(this.engine, "vlsRenderEffect", () => {
            return this.volumetricLights;
        });

        const oceanRenderEffect = new PostProcessRenderEffect(this.engine, "oceanRenderEffect", () => {
            return this.oceans;
        });

        const cloudsRenderEffect = new PostProcessRenderEffect(this.engine, "cloudsRenderEffect", () => {
            return this.clouds;
        });

        const atmosphereRenderEffect = new PostProcessRenderEffect(this.engine, "atmosphereRenderEffect", () => {
            return this.atmospheres;
        });

        const ringRenderEffect = new PostProcessRenderEffect(this.engine, "ringRenderEffect", () => {
            return this.rings;
        })

        const fxaaRenderEffect = new PostProcessRenderEffect(this.engine, "fxaaRenderEffect", () => {
            return [new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, this.engine)];
        })

        this.addEffect(starfieldRenderEffect);
        this.addEffect(vlsRenderEffect);
        this.addEffect(oceanRenderEffect);
        this.addEffect(cloudsRenderEffect);
        this.addEffect(atmosphereRenderEffect);
        this.addEffect(ringRenderEffect);
        this.addEffect(fxaaRenderEffect);
    }

    attachToCamera(camera: Camera) {
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, camera);
    }
}