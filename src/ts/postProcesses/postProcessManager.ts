import { UberScene } from "../uberCore/uberScene";
import { UberRenderingPipeline } from "../uberCore/uberRenderingPipeline";
import { BloomEffect, Engine, FxaaPostProcess, PostProcessRenderEffect, Texture } from "@babylonjs/core";
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
import { ColorCorrection } from "../uberCore/postProcesses/colorCorrection";
import { extractRelevantPostProcesses } from "../utils/extractRelevantPostProcesses";

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

    readonly spaceRenderingPipeline: UberRenderingPipeline;
    readonly surfaceRenderingPipeline: UberRenderingPipeline;
    private currentRenderingPipeline: UberRenderingPipeline;

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

    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    readonly fxaaRenderEffect: PostProcessRenderEffect;
    readonly bloomRenderEffect: BloomEffect;

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();

        this.colorCorrection = new ColorCorrection("colorCorrection", scene.getEngine());
        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine());

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "colorCorrectionRenderEffect", () => {
            return [this.colorCorrection];
        });
        this.fxaaRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "fxaaRenderEffect", () => {
            return [this.fxaa];
        });

        this.spaceRenderingPipeline = new UberRenderingPipeline("space", scene.getEngine());
        scene.postProcessRenderPipelineManager.addPipeline(this.spaceRenderingPipeline);

        this.surfaceRenderingPipeline = new UberRenderingPipeline("surface", scene.getEngine());
        scene.postProcessRenderPipelineManager.addPipeline(this.surfaceRenderingPipeline);

        this.currentRenderingPipeline = this.spaceRenderingPipeline;

        this.starFieldRenderEffect = new PostProcessRenderEffect(this.engine, "starFieldRenderEffect", () => {
            return this.starFields;
        });

        this.overlayRenderEffect = new PostProcessRenderEffect(this.engine, "overlayRenderEffect", () => {
            return this.overlays;
        });

        this.bloomRenderEffect = new BloomEffect(scene, 1, 0.3, 32);

        this.colorCorrection.exposure = 1.1;
        this.colorCorrection.gamma = 1.2;
        this.colorCorrection.saturation = 0.9;
    }

    public addOcean(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.oceans.push(new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stars));
    }

    public getOcean(planet: TelluricPlanet): OceanPostProcess {
        for (const ocean of this.oceans) if (ocean.body === planet) return ocean;
        throw new Error("No ocean found for: " + planet.name);
    }

    public addClouds(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.clouds.push(new FlatCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stars));
    }

    public getClouds(planet: TelluricPlanet): FlatCloudsPostProcess {
        for (const clouds of this.clouds) if (clouds.body === planet) return clouds;
        throw new Error("No clouds found for: " + planet.name);
    }

    public addAtmosphere(planet: GasPlanet | TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.atmospheres.push(new AtmosphericScatteringPostProcess(`${planet.name}Atmosphere`, planet, Settings.ATMOSPHERE_HEIGHT, this.scene, stars));
    }

    public getAtmosphere(planet: GasPlanet | TelluricPlanet): AtmosphericScatteringPostProcess {
        for (const atmosphere of this.atmospheres) if (atmosphere.body === planet) return atmosphere;
        throw new Error("No atmosphere found for: " + planet.name);
    }

    public addRings(body: AbstractBody, stars: (Star | BlackHole)[]) {
        this.rings.push(new RingsPostProcess(body, this.scene, stars));
    }

    public getRings(body: AbstractBody): RingsPostProcess {
        for (const rings of this.rings) if (rings.body === body) return rings;
        throw new Error("No rings found for: " + body.name);
    }

    public addStarField(stars: (Star | BlackHole)[], planets: AbstractBody[]) {
        this.starFields.push(new StarfieldPostProcess(this.scene, stars, planets));
    }

    public addOverlay(body: AbstractBody) {
        this.overlays.push(new OverlayPostProcess(body, this.scene));
    }

    public addVolumetricLight(star: Star) {
        this.volumetricLights.push(new VolumetricLight(star, this.scene));
    }

    public getVolumetricLight(star: Star): VolumetricLight {
        for (const volumetricLight of this.volumetricLights) if (volumetricLight.body === star) return volumetricLight;
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
                if ((body as Star).postProcesses.volumetricLight) this.addVolumetricLight(body as Star);
                break;
            case BodyType.TELLURIC:
                if ((body as TelluricPlanet).postProcesses.atmosphere) this.addAtmosphere(body as TelluricPlanet, stars);
                if ((body as TelluricPlanet).postProcesses.clouds) this.addClouds(body as TelluricPlanet, stars);
                if ((body as TelluricPlanet).postProcesses.ocean) this.addOcean(body as TelluricPlanet, stars);
                break;
            case BodyType.GAZ:
                if ((body as GasPlanet).postProcesses.atmosphere) this.addAtmosphere(body as GasPlanet, stars);
                break;
            case BodyType.BLACK_HOLE:
                if ((body as BlackHole).postProcesses.blackHole) this.addBlackHole(body as BlackHole);
                break;
            default:
                throw new Error(`Unknown body type : ${body.bodyType}`);
        }
    }

    public setBody(body: AbstractBody) {
        if (this.currentBody == body) return;
        this.currentBody = body;

        this.currentRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.init();
    }

    public setOrder(order: PostProcessType[]) {
        this.renderingOrder = order;
    }

    public setSpaceOrder() {
        if (this.currentRenderingPipeline == this.spaceRenderingPipeline) return;
        this.surfaceRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.currentRenderingPipeline = this.spaceRenderingPipeline;
        this.renderingOrder = [
            PostProcessType.VOLUMETRIC_LIGHT,
            PostProcessType.OCEAN,
            PostProcessType.CLOUDS,
            PostProcessType.ATMOSPHERE,
            PostProcessType.RING,
            PostProcessType.BLACK_HOLE
        ];
        this.init();
    }

    public setSurfaceOrder() {
        if (this.currentRenderingPipeline == this.surfaceRenderingPipeline) return;
        this.spaceRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.currentRenderingPipeline = this.surfaceRenderingPipeline;
        this.renderingOrder = [
            PostProcessType.VOLUMETRIC_LIGHT,
            PostProcessType.BLACK_HOLE,
            PostProcessType.RING,
            PostProcessType.OCEAN,
            PostProcessType.CLOUDS,
            PostProcessType.ATMOSPHERE
        ];
        this.init();
    }

    public getCurrentBody() {
        if (this.currentBody == null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    public init() {
        //const [bodyVolumetricLights, otherVolumetricLights] = extractRelevantPostProcesses(this.volumetricLights, this.getCurrentBody());
        const bodyVolumetricLights: VolumetricLight[] = [];
        const otherVolumetricLights: VolumetricLight[] = [];
        for (const volumetricLight of this.volumetricLights) {
            if (volumetricLight.body == this.getCurrentBody()) bodyVolumetricLights.push(volumetricLight);
            else otherVolumetricLights.push(volumetricLight);
        }
        const otherVolumetricLightsRenderEffect = new PostProcessRenderEffect(this.engine, "otherVolumetricLightsRenderEffect", () => {
            return otherVolumetricLights;
        });
        const bodyVolumetricLightsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyVolumetricLightsRenderEffect", () => {
            return bodyVolumetricLights;
        });

        const [bodyBlackHoles, otherBlackHoles] = extractRelevantPostProcesses(this.blackHoles, this.getCurrentBody());
        const otherBlackHolesRenderEffect = new PostProcessRenderEffect(this.engine, "otherBlackHolesRenderEffect", () => {
            return otherBlackHoles;
        });
        const bodyBlackHolesRenderEffect = new PostProcessRenderEffect(this.engine, "bodyBlackHolesRenderEffect", () => {
            return bodyBlackHoles;
        });

        const [bodyOceans, otherOceans] = extractRelevantPostProcesses(this.oceans, this.getCurrentBody());
        const otherOceansRenderEffect = new PostProcessRenderEffect(this.engine, "otherOceansRenderEffect", () => {
            return otherOceans;
        });
        const bodyOceansRenderEffect = new PostProcessRenderEffect(this.engine, "bodyOceansRenderEffect", () => {
            return bodyOceans;
        });

        const [bodyClouds, otherClouds] = extractRelevantPostProcesses(this.clouds, this.getCurrentBody());
        const otherCloudsRenderEffect = new PostProcessRenderEffect(this.engine, "otherCloudsRenderEffect", () => {
            return otherClouds;
        });
        const bodyCloudsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyCloudsRenderEffect", () => {
            return bodyClouds;
        });

        const [bodyAtmospheres, otherAtmospheres] = extractRelevantPostProcesses(this.atmospheres, this.getCurrentBody());
        const otherAtmospheresRenderEffect = new PostProcessRenderEffect(this.engine, "otherAtmospheresRenderEffect", () => {
            return otherAtmospheres;
        });
        const bodyAtmospheresRenderEffect = new PostProcessRenderEffect(this.engine, "bodyAtmospheresRenderEffect", () => {
            return bodyAtmospheres;
        });

        const [bodyRings, otherRings] = extractRelevantPostProcesses(this.rings, this.getCurrentBody());
        const otherRingsRenderEffect = new PostProcessRenderEffect(this.engine, "otherRingsRenderEffect", () => {
            return otherRings;
        });
        const bodyRingsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyRingsHolesRenderEffect", () => {
            return bodyRings;
        });

        this.currentRenderingPipeline.addEffect(this.starFieldRenderEffect);

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.currentRenderingPipeline.addEffect(otherVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.currentRenderingPipeline.addEffect(otherBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.currentRenderingPipeline.addEffect(otherOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.currentRenderingPipeline.addEffect(otherCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.currentRenderingPipeline.addEffect(otherAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.currentRenderingPipeline.addEffect(otherRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type: " + postProcessType);
            }
        }

        for (const postProcessType of this.renderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.currentRenderingPipeline.addEffect(bodyVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.currentRenderingPipeline.addEffect(bodyBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.currentRenderingPipeline.addEffect(bodyOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.currentRenderingPipeline.addEffect(bodyCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.currentRenderingPipeline.addEffect(bodyAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.currentRenderingPipeline.addEffect(bodyRingsRenderEffect);
                    break;
                default:
                    throw new Error("Invalid postprocess type: " + postProcessType);
            }
        }

        this.currentRenderingPipeline.addEffect(this.overlayRenderEffect);

        this.currentRenderingPipeline.addEffect(this.fxaaRenderEffect);

        this.currentRenderingPipeline.addEffect(this.bloomRenderEffect);

        this.currentRenderingPipeline.addEffect(this.colorCorrectionRenderEffect);

        this.currentRenderingPipeline.attachToCamera(this.scene.getActiveUberCamera());
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
