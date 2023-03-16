import { UberScene } from "../uberCore/uberScene";
import { UberRenderingPipeline } from "../uberCore/uberRenderingPipeline";
import { OceanPostProcess } from "./oceanPostProcess";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { Star } from "../bodies/stellarObjects/star";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { FlatCloudsPostProcess } from "./flatCloudsPostProcess";
import { Settings } from "../settings";
import { AtmosphericScatteringPostProcess } from "./atmosphericScatteringPostProcess";
import { AbstractBody } from "../bodies/abstractBody";
import { RingsPostProcess } from "./ringsPostProcess";
import { StarfieldPostProcess } from "./starfieldPostProcess";
import { OverlayPostProcess } from "./overlayPostProcess";
import { VolumetricLight } from "./volumetricLight";
import { BlackHolePostProcess } from "./blackHolePostProcess";
import { GasPlanet } from "../bodies/planemos/gasPlanet";
import { ColorCorrection } from "../uberCore/postProcesses/colorCorrection";
import { extractRelevantPostProcesses } from "../utils/extractRelevantPostProcesses";
import { CloudsPostProcess, VolumetricCloudsPostProcess } from "./volumetricCloudsPostProcess";
import { BODY_TYPE } from "../descriptors/common";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { Engine } from "@babylonjs/core/Engines/engine";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";


export enum PostProcessType {
    VOLUMETRIC_LIGHT,
    OCEAN,
    CLOUDS,
    ATMOSPHERE,
    RING,
    BLACK_HOLE
}

export class PostProcessManager {
    private readonly engine: Engine;
    private readonly scene: UberScene;

    private readonly spaceRenderingPipeline: UberRenderingPipeline;
    private readonly surfaceRenderingPipeline: UberRenderingPipeline;
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

    private readonly starFields: StarfieldPostProcess[] = [];
    private readonly volumetricLights: VolumetricLight[] = [];
    private readonly oceans: OceanPostProcess[] = [];
    private readonly clouds: CloudsPostProcess[] = [];
    private readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    private readonly rings: RingsPostProcess[] = [];
    private readonly blackHoles: BlackHolePostProcess[] = [];
    private readonly overlays: OverlayPostProcess[] = [];

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    private readonly starFieldRenderEffect: PostProcessRenderEffect;
    private readonly overlayRenderEffect: PostProcessRenderEffect;

    private readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    private readonly fxaaRenderEffect: PostProcessRenderEffect;
    private readonly bloomRenderEffect: BloomEffect;

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

    /**
     * Creates a new Ocean postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addOcean(planet: TelluricPlanemo, stellarObjects: StellarObject[]) {
        this.oceans.push(new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stellarObjects));
    }

    /**
     * Returns the ocean post process for the given planet. Throws an error if no ocean is found.
     * @param planet A telluric planet
     */
    public getOcean(planet: TelluricPlanemo): OceanPostProcess {
        for (const ocean of this.oceans) if (ocean.body === planet) return ocean;
        throw new Error("No ocean found for: " + planet.name);
    }

    /**
     * Creates a new Clouds postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addClouds(planet: TelluricPlanemo, stellarObjects: StellarObject[]) {
        if (!Settings.ENABLE_VOLUMETRIC_CLOUDS)
            this.clouds.push(new FlatCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stellarObjects));
        else this.clouds.push(new VolumetricCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stellarObjects));
    }

    /**
     * Returns the clouds post process for the given planet. Throws an error if no clouds are found.
     * @param planet A telluric planet
     */
    public getClouds(planet: TelluricPlanemo): CloudsPostProcess {
        for (const clouds of this.clouds) if (clouds.body === planet) return clouds;
        throw new Error("No clouds found for: " + planet.name);
    }

    /**
     * Creates a new Atmosphere postprocess for the given planet and adds it to the manager.
     * @param planet A gas or telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addAtmosphere(planet: GasPlanet | TelluricPlanemo, stellarObjects: StellarObject[]) {
        this.atmospheres.push(
            new AtmosphericScatteringPostProcess(
                `${planet.name}Atmosphere`,
                planet,
                Settings.ATMOSPHERE_HEIGHT * Math.max(1, planet.descriptor.radius / Settings.EARTH_RADIUS),
                this.scene,
                stellarObjects
            )
        );
    }

    /**
     * Returns the atmosphere post process for the given planet. Throws an error if no atmosphere is found.
     * @param planet A gas or telluric planet
     */
    public getAtmosphere(planet: GasPlanet | TelluricPlanemo): AtmosphericScatteringPostProcess {
        for (const atmosphere of this.atmospheres) if (atmosphere.body === planet) return atmosphere;
        throw new Error("No atmosphere found for: " + planet.name);
    }

    /**
     * Creates a Rings postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes
     */
    public addRings(body: AbstractBody, stellarObjects: StellarObject[]) {
        this.rings.push(new RingsPostProcess(body, this.scene, stellarObjects));
    }

    /**
     * Returns the rings post process for the given body. Throws an error if no rings are found.
     * @param body A body
     */
    public getRings(body: AbstractBody): RingsPostProcess {
        for (const rings of this.rings) if (rings.body === body) return rings;
        throw new Error("No rings found for: " + body.name);
    }

    /**
     * Creates a new Starfield postprocess and adds it to the manager.
     * @param stellarObjects An array of stars or black holes
     * @param planets An array of planets
     */
    public addStarField(stellarObjects: StellarObject[], planets: AbstractBody[]) {
        this.starFields.push(new StarfieldPostProcess(this.scene, stellarObjects, planets));
    }

    /**
     * Creates a new Overlay postprocess for the given body and adds it to the manager.
     * @param body A body
     */
    public addOverlay(body: AbstractBody) {
        this.overlays.push(new OverlayPostProcess(body, this.scene));
    }

    /**
     * Creates a new VolumetricLight postprocess for the given star and adds it to the manager.
     * @param star A star
     */
    public addVolumetricLight(star: Star) {
        this.volumetricLights.push(new VolumetricLight(star, this.scene));
    }

    /**
     * Returns the volumetric light post process for the given star. Throws an error if no volumetric light is found.
     * @param star A star
     */
    public getVolumetricLight(star: Star): VolumetricLight {
        for (const volumetricLight of this.volumetricLights) if (volumetricLight.body === star) return volumetricLight;
        throw new Error("No volumetric light found for: " + star.name);
    }

    /**
     * Creates a new BlackHole postprocess for the given black hole and adds it to the manager.
     * @param blackHole A black hole
     */
    public addBlackHole(blackHole: BlackHole) {
        this.blackHoles.push(new BlackHolePostProcess(blackHole.name, blackHole, this.scene));
    }

    public getBlackHole(blackHole: BlackHole): BlackHolePostProcess {
        for (const bh of this.blackHoles) if (bh.body === blackHole) return bh;
        throw new Error("No black hole found for: " + blackHole.name);
    }

    /**
     * Adds all post processes for the given body.
     * @param body A body
     * @param stellarObjects An array of stars or black holes lighting the body
     */
    public addBody(body: AbstractBody, stellarObjects: StellarObject[]) {
        if (body.postProcesses.rings) this.addRings(body, stellarObjects);
        if (body.postProcesses.overlay) this.addOverlay(body);
        switch (body.descriptor.bodyType) {
            case BODY_TYPE.STAR:
                if ((body as Star).postProcesses.volumetricLight) this.addVolumetricLight(body as Star);
                break;
            case BODY_TYPE.TELLURIC:
                if ((body as TelluricPlanemo).postProcesses.atmosphere) this.addAtmosphere(body as TelluricPlanemo, stellarObjects);
                if ((body as TelluricPlanemo).postProcesses.clouds) this.addClouds(body as TelluricPlanemo, stellarObjects);
                if ((body as TelluricPlanemo).postProcesses.ocean) this.addOcean(body as TelluricPlanemo, stellarObjects);
                break;
            case BODY_TYPE.GAS:
                if ((body as GasPlanet).postProcesses.atmosphere) this.addAtmosphere(body as GasPlanet, stellarObjects);
                break;
            case BODY_TYPE.BLACK_HOLE:
                if ((body as BlackHole).postProcesses.blackHole) this.addBlackHole(body as BlackHole);
                break;
            default:
                throw new Error(`Unknown body type : ${body.descriptor.bodyType}`);
        }
    }

    public setBody(body: AbstractBody) {
        if (this.currentBody == body) return;
        this.currentBody = body;

        this.currentRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.init();
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

    private getCurrentBody() {
        if (this.currentBody == null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    private init() {
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
