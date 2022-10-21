import { Camera, Engine, PostProcess, PostProcessRenderEffect, PostProcessRenderPipeline } from "@babylonjs/core";
import { UberScene } from "../../core/uberScene";
import { AbstractBody } from "../../bodies/abstractBody";
import { VolumetricLight } from "../volumetricLight";
import { BodyType } from "../../bodies/interfaces";
import { Star } from "../../bodies/stars/star";
import { BlackHole } from "../../bodies/blackHole";
import { TelluricPlanet } from "../../bodies/planets/telluricPlanet";

export enum PostProcessType {
    VOLUMETRIC_LIGHT,
    OCEAN,
    CLOUDS,
    ATMOSPHERE,
    RING,
    BLACK_HOLE
}

export enum DistanceType {
    SURFACE, SPACE
}

export class UberRenderingPipeline extends PostProcessRenderPipeline {
    readonly scene: UberScene;
    readonly engine: Engine;

    protected renderingOrder: PostProcessType[] = [
        PostProcessType.VOLUMETRIC_LIGHT,
        PostProcessType.OCEAN,
        PostProcessType.CLOUDS,
        PostProcessType.ATMOSPHERE,
        PostProcessType.RING,
        PostProcessType.BLACK_HOLE,
    ];

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

    private currentBody: AbstractBody | null = null;

    constructor(name: string, scene: UberScene) {
        super(scene.getEngine(), name);
        this.scene = scene;
        this.engine = this.scene.getEngine();

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

    private getCurrentBody(): AbstractBody {
        if (this.currentBody == null) throw new Error("No body set");
        return this.currentBody;
    }

    protected resetEffects() {
        this._renderEffects = {};
        this._renderEffectsForIsolatedPass = [];
    }

    private init() {
        const bodyType = this.getCurrentBody().bodyType;
        let otherVolumetricLights = this.volumetricLights;
        let bodyVolumetricLight: VolumetricLight | null = null;
        if (bodyType == BodyType.STAR) {
            otherVolumetricLights = this.volumetricLights.filter((volumetricLight) => volumetricLight !== (this.getCurrentBody() as Star).postProcesses.volumetricLight);
            bodyVolumetricLight = (this.getCurrentBody() as Star).postProcesses.volumetricLight;
        }

        let otherBlackHoles = this.blackHoles;
        let bodyBlackHole: PostProcess | null = null;
        if (bodyType == BodyType.BLACK_HOLE) {
            otherBlackHoles = this.blackHoles.filter((blackHole) => blackHole !== (this.getCurrentBody() as BlackHole).postProcesses.blackHole);
            bodyBlackHole = (this.getCurrentBody() as BlackHole).postProcesses.blackHole;
        }

        let otherOceans = this.oceans;
        let bodyOcean: PostProcess | null = null;
        /*if (bodyType == BodyType.TELLURIC && (this.getCurrentBody() as TelluricPlanet).postProcesses.ocean) {
            otherOceans = this.oceans.filter((ocean) => ocean !== (this.getCurrentBody() as TelluricPlanet).postProcesses.ocean);
            bodyOcean = (this.getCurrentBody() as TelluricPlanet).postProcesses.ocean as PostProcess;
        }*/ //FIXME: how to access to the ocean of a planet?

        let otherClouds = this.clouds;
        let bodyClouds: PostProcess | null = null;
        /*if (bodyType == BodyType.TELLURIC && (this.getCurrentBody() as TelluricPlanet).postProcesses.clouds) {
            otherClouds = this.clouds.filter((cloud) => cloud !== (this.getCurrentBody() as TelluricPlanet).postProcesses.clouds);
            bodyClouds = (this.getCurrentBody() as TelluricPlanet).postProcesses.clouds as PostProcess;
        }*/

        let otherAtmospheres = this.atmospheres;
        let bodyAtmosphere: PostProcess | null = null;
        if ((bodyType == BodyType.TELLURIC || bodyType == BodyType.GAZ) && (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere) {
            otherAtmospheres = this.atmospheres.filter((atmosphere) => atmosphere !== (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere);
            bodyAtmosphere = (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere as PostProcess;
        }

        let otherRings = this.rings;
        let bodyRings: PostProcess | null = null;
        if (this.getCurrentBody().postProcesses.rings) {
            otherRings = this.rings.filter((ring) => ring != this.getCurrentBody().postProcesses.rings);
            bodyRings = this.getCurrentBody().postProcesses.rings;
        }

        const otherVolumetricLightsRenderEffect = new PostProcessRenderEffect(this.engine, "otherVolumetricLightsRenderEffect", () => {
            return otherVolumetricLights;
        });
        const bodyVolumetricLightRenderEffect = new PostProcessRenderEffect(this.engine, "bodyVolumetricLightsRenderEffect", () => {
            return [bodyVolumetricLight as VolumetricLight];
        });

        const otherBlackHolesRenderEffect = new PostProcessRenderEffect(this.engine, "otherBlackHolesRenderEffect", () => {
            return otherBlackHoles;
        });
        const bodyBlackHoleRenderEffect = new PostProcessRenderEffect(this.engine, "bodyBlackHolesRenderEffect", () => {
            return [bodyBlackHole as PostProcess];
        });

        const otherOceansRenderEffect = new PostProcessRenderEffect(this.engine, "otherOceansRenderEffect", () => {
            return otherOceans;
        });
        const bodyOceanRenderEffect = new PostProcessRenderEffect(this.engine, "bodyOceanRenderEffect", () => {
            return [bodyOcean as PostProcess];
        });

        const otherCloudsRenderEffect = new PostProcessRenderEffect(this.engine, "otherCloudsRenderEffect", () => {
            return otherClouds;
        });
        const bodyCloudsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyCloudsRenderEffect", () => {
            return [bodyClouds as PostProcess];
        });

        const otherAtmospheresRenderEffect = new PostProcessRenderEffect(this.engine, "otherAtmospheresRenderEffect", () => {
            return otherAtmospheres;
        });
        const bodyAtmosphereRenderEffect = new PostProcessRenderEffect(this.engine, "bodyAtmospheresRenderEffect", () => {
            return [bodyAtmosphere as PostProcess];
        });

        const otherRingsRenderEffect = new PostProcessRenderEffect(this.engine, "otherRingsRenderEffect", () => {
            return otherRings;
        });
        const bodyRingsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyRingsRenderEffect", () => {
            return [bodyRings as PostProcess];
        });

        this.addEffect(this.starFieldRenderEffect);

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.addEffect(otherVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.addEffect(otherBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.addEffect(otherOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.addEffect(otherCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.addEffect(otherAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.addEffect(otherRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type in " + this.name);
            }
        }

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    if (bodyVolumetricLight) this.addEffect(bodyVolumetricLightRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    if (bodyBlackHole) this.addEffect(bodyBlackHoleRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    if (bodyOcean) this.addEffect(bodyOceanRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    if (bodyClouds) this.addEffect(bodyCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    if (bodyAtmosphere) this.addEffect(bodyAtmosphereRenderEffect);
                    break;
                case PostProcessType.RING:
                    if (bodyRings) this.addEffect(bodyRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type in " + this.name);
            }
        }

        this.addEffect(this.colorCorrectionRenderEffect);

        this.addEffect(this.overlayRenderEffect);

        this.addEffect(this.fxaaRenderEffect);

    }

    public setBody(body: AbstractBody) {
        if (this.currentBody == body) return;
        this.currentBody = body;
        this.resetEffects();

        const cameras = new Array(...this.cameras);
        this.detachCameras();

        this.init();

        this._attachCameras(cameras, false);
    }

    public setOrder(order: PostProcessType[]) {
        let sameOrder=true;
        for(let i=0;i<order.length;i++){
            if(order[i]!=this.renderingOrder[i]){
                sameOrder=false;
                break;
            }
        }
        if(sameOrder) return;

        this.renderingOrder = order;
        this.resetEffects();

        const cameras = new Array(...this.cameras);
        this.detachCameras();

        this.init();

        this._attachCameras(cameras, false);
    }

    public setSpaceOrder() {
        this.setOrder([
            PostProcessType.VOLUMETRIC_LIGHT,
            PostProcessType.OCEAN,
            PostProcessType.CLOUDS,
            PostProcessType.ATMOSPHERE,
            PostProcessType.RING,
            PostProcessType.BLACK_HOLE,
        ]);
    }

    public setSurfaceOrder() {
        this.setOrder([
            PostProcessType.VOLUMETRIC_LIGHT,
            PostProcessType.BLACK_HOLE,
            PostProcessType.RING,
            PostProcessType.OCEAN,
            PostProcessType.CLOUDS,
            PostProcessType.ATMOSPHERE
        ]);
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
