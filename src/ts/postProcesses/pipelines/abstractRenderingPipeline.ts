import {
    Camera,
    Engine,
    FxaaPostProcess,
    PostProcessRenderEffect,
    PostProcessRenderPipeline,
    Texture,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";
import { StarfieldPostProcess } from "../starfieldPostProcess";
import { OceanPostProcess } from "../planetPostProcesses/oceanPostProcess";
import { FlatCloudsPostProcess } from "../planetPostProcesses/flatCloudsPostProcess";
import { AtmosphericScatteringPostProcess } from "../planetPostProcesses/atmosphericScatteringPostProcess";
import { RingsPostProcess } from "../planetPostProcesses/ringsPostProcess";
import { VolumetricCloudsPostProcess } from "../planetPostProcesses/volumetricCloudsPostProcess";
import { UberScene } from "../../core/uberScene";
import { BlackHolePostProcess } from "../planetPostProcesses/blackHolePostProcess";

export enum PostProcessType {
    Starfields,
    VolumetricLights,
    Oceans,
    Clouds,
    Atmospheres,
    Rings,
    FXAA,
    BLACK_HOLE
}

export abstract class AbstractRenderingPipeline extends PostProcessRenderPipeline {
    readonly scene: UberScene;
    readonly engine: Engine;

    readonly starfields: StarfieldPostProcess[] = [];
    readonly volumetricLights: VolumetricLightScatteringPostProcess[] = [];
    readonly oceans: OceanPostProcess[] = [];
    readonly clouds: (FlatCloudsPostProcess | VolumetricCloudsPostProcess)[] = [];
    readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    readonly rings: RingsPostProcess[] = [];
    readonly blackHoles: BlackHolePostProcess[] = [];

    protected constructor(name: string, scene: UberScene) {
        super(scene.getEngine(), name);
        this.scene = scene;
        this.engine = this.scene.getEngine();
        this.scene.postProcessRenderPipelineManager.addPipeline(this);
    }

    init(order: Set<PostProcessType>) {
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
        });

        const fxaaRenderEffect = new PostProcessRenderEffect(this.engine, "fxaaRenderEffect", () => {
            return [new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, this.engine)];
        });

        const blackHoleRenderEffect = new PostProcessRenderEffect(this.engine, "blackHoleRenderEffect", () => {
            return this.blackHoles;
        })

        for (const postProcessType of order) {
            switch (postProcessType) {
                case PostProcessType.Starfields:
                    this.addEffect(starfieldRenderEffect);
                    break;
                case PostProcessType.VolumetricLights:
                    this.addEffect(vlsRenderEffect);
                    break;
                case PostProcessType.Oceans:
                    this.addEffect(oceanRenderEffect);
                    break;
                case PostProcessType.Clouds:
                    this.addEffect(cloudsRenderEffect);
                    break;
                case PostProcessType.Atmospheres:
                    this.addEffect(atmosphereRenderEffect);
                    break;
                case PostProcessType.Rings:
                    this.addEffect(ringRenderEffect);
                    break;
                case PostProcessType.FXAA:
                    this.addEffect(fxaaRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type in " + this.name);
            }
        }

        //TODO: integrate to label system
        this.addEffect(blackHoleRenderEffect);

        this.addEffect(new PostProcessRenderEffect(this.engine, "colorCorrectionRenderEffect", () => {
            return [this.scene.colorCorrection];
        }));

        this.addEffect(new PostProcessRenderEffect(this.engine, "overlayRenderEffect", () => {
            return [this.scene.overlay];
        }));
        //this.addEffect(new BloomEffect(this.scene, 1, 0.2, 3));
    }

    attachToCamera(camera: Camera) {
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, camera);
        //FIXME: this is a BabylonJS issue : the length does not increase for some reason
        this.cameras.length += 1;
    }

    detachCamera(camera: Camera) {
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, camera);
        //FIXME: this is a BabylonJS issue : the length does not increase for some reason
        this.cameras.length -= 1;
    }

    detachCameras() {
        for(const camera of this.cameras) {
            this.detachCamera(camera);
        }
    }
}
