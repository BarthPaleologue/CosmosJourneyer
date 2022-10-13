import {
    BloomEffect,
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
import { AbstractBody } from "../../bodies/abstractBody";
import { VolumetricLight } from "../volumetricLight";

export enum PostProcessType {
    VOLUMETRIC_LIGHT,
    OCEAN,
    CLOUDS,
    ATMOSPHERE,
    RING,
    BLACK_HOLE
}

export abstract class AbstractRenderingPipeline extends PostProcessRenderPipeline {
    readonly scene: UberScene;
    readonly engine: Engine;

    abstract readonly renderingOrder: Set<PostProcessType>;

    readonly starFields: StarfieldPostProcess[] = [];
    readonly volumetricLights: VolumetricLight[] = [];
    readonly oceans: OceanPostProcess[] = [];
    readonly clouds: (FlatCloudsPostProcess | VolumetricCloudsPostProcess)[] = [];
    readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    readonly rings: RingsPostProcess[] = [];
    readonly blackHoles: BlackHolePostProcess[] = [];

    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    readonly overlayRenderEffect: PostProcessRenderEffect;
    readonly fxaaRenderEffect: PostProcessRenderEffect;

    protected constructor(name: string, scene: UberScene) {
        super(scene.getEngine(), name);
        this.scene = scene;
        this.engine = this.scene.getEngine();
        this.scene.postProcessRenderPipelineManager.addPipeline(this);

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(this.engine, "colorCorrectionRenderEffect", () => {
            return [this.scene.colorCorrection];
        });

        this.overlayRenderEffect = new PostProcessRenderEffect(this.engine, "overlayRenderEffect", () => {
            return [this.scene.overlay];
        });

        this.fxaaRenderEffect = new PostProcessRenderEffect(this.engine, "fxaaRenderEffect", () => {
            return [this.scene.fxaa];
        });
    }

    public init() {
        const starFieldRenderEffect = new PostProcessRenderEffect(this.engine, "starFieldRenderEffect", () => {
            return this.starFields;
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

        const blackHoleRenderEffect = new PostProcessRenderEffect(this.engine, "blackHoleRenderEffect", () => {
            return this.blackHoles;
        });


        this.addEffect(starFieldRenderEffect);

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.addEffect(vlsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.addEffect(blackHoleRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.addEffect(oceanRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.addEffect(cloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.addEffect(atmosphereRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.addEffect(ringRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type in " + this.name);
            }
        }

        //this.addEffect(new BloomEffect(this.scene, 0.5, 1, 64));

        this.addEffect(this.colorCorrectionRenderEffect);

        this.addEffect(this.overlayRenderEffect);

        this.addEffect(this.fxaaRenderEffect);
    }

    public setBody(body: AbstractBody) {
        this._reset();
        const otherVolumetricLights = this.volumetricLights.filter((volumetricLight) => volumetricLight !== body.postProcesses.volumetricLight);
        const otherBlackHoles = this.blackHoles.filter((blackHole) => blackHole !== body.postProcesses.blackHole);
        const otherOceans = this.oceans.filter((ocean) => ocean !== body.postProcesses.ocean);
        const otherClouds = this.clouds.filter((cloud) => cloud !== body.postProcesses.clouds);
        const otherAtmospheres = this.atmospheres.filter((atmosphere) => atmosphere !== body.postProcesses.atmosphere);
        const otherRings = this.rings.filter((ring) => ring !== body.postProcesses.ring);

        const otherVolumetricLightsRenderEffect = new PostProcessRenderEffect(this.engine, "otherVolumetricLightsRenderEffect", () => {
            return otherVolumetricLights;
        });
        const otherBlackHolesRenderEffect = new PostProcessRenderEffect(this.engine, "otherBlackHolesRenderEffect", () => {
            return otherBlackHoles;
        });
        const otherOceansRenderEffect = new PostProcessRenderEffect(this.engine, "otherOceansRenderEffect", () => {
            return otherOceans;
        });
        const otherCloudsRenderEffect = new PostProcessRenderEffect(this.engine, "otherCloudsRenderEffect", () => {
            return otherClouds;
        });
        const otherAtmospheresRenderEffect = new PostProcessRenderEffect(this.engine, "otherAtmospheresRenderEffect", () => {
            return otherAtmospheres;
        });
        const otherRingsRenderEffect = new PostProcessRenderEffect(this.engine, "otherRingsRenderEffect", () => {
            return otherRings;
        });

    }

    attachToCamera(camera: Camera) {
        this._attachCameras([camera], false);
    }

    detachCamera(camera: Camera) {
        this._detachCameras([camera]);
    }

    detachCameras() {
        this._detachCameras(this.cameras);
    }
}
