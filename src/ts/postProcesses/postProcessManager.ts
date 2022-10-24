import { UberScene } from "../core/uberScene";
import { UberRenderingPipeline } from "../core/uberRenderingPipeline";
import {
    Engine,
    FxaaPostProcess,
    PostProcess,
    PostProcessRenderEffect,
    VolumetricLightScatteringPostProcess
} from "@babylonjs/core";
import { OceanPostProcess } from "./oceanPostProcess";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { Star } from "../bodies/stars/star";
import { BlackHole } from "../bodies/blackHole";
import { FlatCloudsPostProcess } from "./flatCloudsPostProcess";
import { Settings } from "../settings";
import { AtmosphericScatteringPostProcess } from "./atmosphericScatteringPostProcess";
import { AbstractBody } from "../bodies/abstractBody";
import { RingsPostProcess } from "./ringsPostProcess";
import { StarfieldPostProcess } from "./starfieldPostProcess";
import { OverlayPostProcess } from "./overlayPostProcess";
import { VolumetricLight } from "./volumetricLight";
import { BlackHolePostProcess } from "./blackHolePostProcess";
import { GasPlanet } from "../bodies/planets/gasPlanet";
import { BodyType } from "../bodies/interfaces";
import { ColorCorrection } from "../core/postProcesses/colorCorrection";

export enum PostProcessType {
    VOLUMETRIC_LIGHT,
    OCEAN,
    CLOUDS,
    ATMOSPHERE,
    RING,
    BLACK_HOLE
}

export class PostProcessManager {
    engine: Engine;
    scene: UberScene;
    uberRenderingPipeline: UberRenderingPipeline;

    private renderingOrder: PostProcessType[] = [
        PostProcessType.VOLUMETRIC_LIGHT,
        PostProcessType.OCEAN,
        PostProcessType.CLOUDS,
        PostProcessType.ATMOSPHERE,
        PostProcessType.RING,
        PostProcessType.BLACK_HOLE
    ];

    private currentBody: AbstractBody | null = null;

    readonly starFields: StarfieldPostProcess[] = [];
    readonly volumetricLights: VolumetricLight[] = [];
    readonly oceans: OceanPostProcess[] = [];
    readonly clouds: FlatCloudsPostProcess[] = [];
    readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    readonly rings: RingsPostProcess[] = [];
    readonly blackHoles: BlackHolePostProcess[] = [];
    readonly overlays: OverlayPostProcess[] = [];

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    readonly starFieldRenderEffect: PostProcessRenderEffect;
    readonly overlayRenderEffect: PostProcessRenderEffect;

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();
        this.uberRenderingPipeline = scene.uberRenderingPipeline;

        this.colorCorrection = this.uberRenderingPipeline.colorCorrection;
        this.fxaa = this.uberRenderingPipeline.fxaa;

        this.starFieldRenderEffect = new PostProcessRenderEffect(this.engine, "starFieldRenderEffect", () => {
            return this.starFields;
        });

        this.overlayRenderEffect = new PostProcessRenderEffect(this.engine, "overlayRenderEffect", () => {
            return this.overlays;
        });

        this.colorCorrection.exposure = 1.1;
        this.colorCorrection.gamma = 1.2;
        this.colorCorrection.saturation = 0.9;
    }

    public addOcean(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.oceans.push(new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stars));
    }

    public getOcean(planet: TelluricPlanet): OceanPostProcess {
        for (const ocean of this.oceans) if (ocean.planet === planet) return ocean;
        throw new Error("No ocean found for: " + planet.name);
    }

    public addClouds(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.clouds.push(new FlatCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stars));
    }

    public getClouds(planet: TelluricPlanet): FlatCloudsPostProcess {
        for (const clouds of this.clouds) if (clouds.planet === planet) return clouds;
        throw new Error("No clouds found for: " + planet.name);
    }

    public addAtmosphere(planet: (GasPlanet | TelluricPlanet), stars: (Star | BlackHole)[]) {
        this.atmospheres.push(new AtmosphericScatteringPostProcess(`${planet.name}Atmosphere`, planet, Settings.ATMOSPHERE_HEIGHT, this.scene, stars));
    }

    public getAtmosphere(planet: (GasPlanet | TelluricPlanet)): AtmosphericScatteringPostProcess {
        for (const atmosphere of this.atmospheres) if (atmosphere.planet === planet) return atmosphere;
        throw new Error("No atmosphere found for: " + planet.name);
    }

    public addRings(body: AbstractBody, stars: (Star | BlackHole)[]) {
        this.rings.push(new RingsPostProcess(`${body.name}Rings`, body, this.scene, stars));
    }

    public getRings(body: AbstractBody): RingsPostProcess {
        for (const rings of this.rings) if (rings.body === body) return rings;
        throw new Error("No rings found for: " + body.name);
    }

    public addStarField(stars: (Star | BlackHole)[], planets: AbstractBody[]) {
        this.starFields.push(new StarfieldPostProcess("starField", this.scene, stars, planets));
    }

    public addOverlay(body: AbstractBody) {
        this.overlays.push(new OverlayPostProcess(body.name, body, this.scene));
    }

    public addVolumetricLight(star: Star) {
        this.volumetricLights.push(new VolumetricLight(star, star.mesh, this.scene));
    }

    public getVolumetricLight(star: Star): VolumetricLight {
        for (const volumetricLight of this.volumetricLights) if (volumetricLight.star === star) return volumetricLight;
        throw new Error("No volumetric light found for: " + star.name);
    }

    public addBlackHole(blackHole: BlackHole) {
        this.blackHoles.push(new BlackHolePostProcess(blackHole.name, blackHole, this.scene));
    }

    public addBody(body: AbstractBody, stars: (Star | BlackHole)[]) {
        if (body.postProcesses.rings) this.addRings(body, stars);
        if (body.postProcesses.overlay) this.addOverlay(body);
        switch (body.bodyType) {
            case BodyType.STAR:
                const star = body as Star;
                if (star.postProcesses.volumetricLight) this.addVolumetricLight(star);
                break;
            case BodyType.TELLURIC:
                const telluric = body as TelluricPlanet;
                if (telluric.postProcesses.atmosphere) this.addAtmosphere(telluric, stars);
                if (telluric.postProcesses.clouds) this.addClouds(telluric, stars);
                if (telluric.postProcesses.ocean) this.addOcean(telluric, stars);
                break;
            case BodyType.GAZ:
                const gas = body as GasPlanet;
                if (gas.postProcesses.atmosphere) this.addAtmosphere(gas, stars);
                break;
            case BodyType.BLACK_HOLE:
                const blackHole = body as BlackHole;
                if (blackHole.postProcesses.blackHole) this.addBlackHole(blackHole);
                break;
            default:
                throw new Error(`Unknown body type : ${body.bodyType}`);
        }
    }

    private getCurrentBody(): AbstractBody {
        if (this.currentBody == null) throw new Error("No body set");
        return this.currentBody;
    }

    public setBody(body: AbstractBody) {
        if (this.currentBody == body) return;
        this.currentBody = body;
        this.uberRenderingPipeline._reset();

        const cameras = new Array(...this.uberRenderingPipeline.cameras);
        this.uberRenderingPipeline.detachCameras();

        this.init();

        this.uberRenderingPipeline._attachCameras(cameras, false);
    }

    public setOrder(order: PostProcessType[]) {
        let sameOrder = true;
        for (let i = 0; i < order.length; i++) {
            if (order[i] != this.renderingOrder[i]) {
                sameOrder = false;
                break;
            }
        }
        if (sameOrder) return;

        this.renderingOrder = order;
        this.uberRenderingPipeline._reset();

        const cameras = new Array(...this.uberRenderingPipeline.cameras);
        this.uberRenderingPipeline.detachCameras();

        this.init();

        this.uberRenderingPipeline._attachCameras(cameras, false);
    }

    public setSpaceOrder() {
        this.setOrder([
            PostProcessType.VOLUMETRIC_LIGHT,
            PostProcessType.OCEAN,
            PostProcessType.CLOUDS,
            PostProcessType.ATMOSPHERE,
            PostProcessType.RING,
            PostProcessType.BLACK_HOLE
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

    public init() {
        //TODO: create here the render effect and disconnect ubercore from the rest
        /*this.uberRenderingPipeline.oceans.push(...this.oceans);
        this.uberRenderingPipeline.clouds.push(...this.clouds);
        this.uberRenderingPipeline.atmospheres.push(...this.atmospheres);
        this.uberRenderingPipeline.rings.push(...this.rings);
        this.uberRenderingPipeline.starFields.push(...this.starFields);
        this.uberRenderingPipeline.overlays.push(...this.overlays);
        this.uberRenderingPipeline.volumetricLights.push(...this.volumetricLights);
        this.uberRenderingPipeline.blackHoles.push(...this.blackHoles);*/


        const bodyType = this.getCurrentBody().bodyType;
        let otherVolumetricLights = this.volumetricLights;
        let bodyVolumetricLight: VolumetricLight | null = null;
        /*if (bodyType == BodyType.STAR) {
            otherVolumetricLights = this.volumetricLights.filter((volumetricLight) => volumetricLight !== (this.getCurrentBody() as Star).postProcesses.volumetricLight);
            bodyVolumetricLight = (this.getCurrentBody() as Star).postProcesses.volumetricLight;
        }*/

        let otherBlackHoles = this.blackHoles;
        let bodyBlackHole: PostProcess | null = null;
        /*if (bodyType == BodyType.BLACK_HOLE) {
            otherBlackHoles = this.blackHoles.filter((blackHole) => blackHole !== (this.getCurrentBody() as BlackHole).postProcesses.blackHole);
            bodyBlackHole = (this.getCurrentBody() as BlackHole).postProcesses.blackHole;
        }*/

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
        /*if ((bodyType == BodyType.TELLURIC || bodyType == BodyType.GAZ) && (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere) {
            otherAtmospheres = this.atmospheres.filter((atmosphere) => atmosphere !== (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere);
            bodyAtmosphere = (this.getCurrentBody() as TelluricPlanet).postProcesses.atmosphere as PostProcess;
        }*/

        let otherRings = this.rings;
        let bodyRings: PostProcess | null = null;
        /*if (this.getCurrentBody().postProcesses.rings) {
            otherRings = this.rings.filter((ring) => ring != this.getCurrentBody().postProcesses.rings);
            bodyRings = this.getCurrentBody().postProcesses.rings;
        }*/

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

        this.uberRenderingPipeline.addEffect(this.starFieldRenderEffect);

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.uberRenderingPipeline.addEffect(otherVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.uberRenderingPipeline.addEffect(otherBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.uberRenderingPipeline.addEffect(otherOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.uberRenderingPipeline.addEffect(otherCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.uberRenderingPipeline.addEffect(otherAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.uberRenderingPipeline.addEffect(otherRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type: " + postProcessType);
            }
        }

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    if (bodyVolumetricLight) this.uberRenderingPipeline.addEffect(bodyVolumetricLightRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    if (bodyBlackHole) this.uberRenderingPipeline.addEffect(bodyBlackHoleRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    if (bodyOcean) this.uberRenderingPipeline.addEffect(bodyOceanRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    if (bodyClouds) this.uberRenderingPipeline.addEffect(bodyCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    if (bodyAtmosphere) this.uberRenderingPipeline.addEffect(bodyAtmosphereRenderEffect);
                    break;
                case PostProcessType.RING:
                    if (bodyRings) this.uberRenderingPipeline.addEffect(bodyRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type: " + postProcessType);
            }
        }

        this.uberRenderingPipeline.addEffect(this.overlayRenderEffect);

        this.uberRenderingPipeline.addFXAA();

        this.uberRenderingPipeline.addColorCorrection();
    }

    public update(deltaTime: number) {
        for (const ring of this.rings) ring.update(deltaTime);
        for (const volumetricLight of this.volumetricLights) volumetricLight.update(deltaTime);
        for (const atmosphere of this.atmospheres) atmosphere.update(deltaTime);
        for (const clouds of this.clouds) clouds.update(deltaTime);
        for (const oceans of this.oceans) oceans.update(deltaTime);
        for (const blackhole of this.blackHoles) blackhole.update(deltaTime);
    }
}