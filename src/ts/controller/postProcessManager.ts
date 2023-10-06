import { UberScene } from "./uberCore/uberScene";
import { UberRenderingPipeline } from "./uberCore/uberRenderingPipeline";
import { OceanPostProcess } from "../view/postProcesses/oceanPostProcess";
import { TelluricPlanemo } from "../view/bodies/planemos/telluricPlanemo";
import { Star } from "../view/bodies/stellarObjects/star";
import { BlackHole } from "../view/bodies/stellarObjects/blackHole";
import { FlatCloudsPostProcess } from "../view/postProcesses/flatCloudsPostProcess";
import { Settings } from "../settings";
import { AtmosphericScatteringPostProcess } from "../view/postProcesses/atmosphericScatteringPostProcess";
import { AbstractBody } from "../view/bodies/abstractBody";
import { RingsPostProcess } from "../view/postProcesses/ringsPostProcess";
import { StarfieldPostProcess } from "../view/postProcesses/starfieldPostProcess";
import { OverlayPostProcess } from "../view/postProcesses/overlayPostProcess";
import { VolumetricLight } from "../view/postProcesses/volumetricLight";
import { BlackHolePostProcess } from "../view/postProcesses/blackHolePostProcess";
import { GasPlanet } from "../view/bodies/planemos/gasPlanet";
import { ColorCorrection } from "./uberCore/postProcesses/colorCorrection";
import { makeSplitRenderEffects } from "../utils/extractRelevantPostProcesses";
import { CloudsPostProcess, VolumetricCloudsPostProcess } from "../view/postProcesses/volumetricCloudsPostProcess";
import { StellarObject } from "../view/bodies/stellarObjects/stellarObject";
import { Engine } from "@babylonjs/core/Engines/engine";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { AbstractObject } from "../view/bodies/abstractObject";
import { BaseObject } from "../view/common";
import { PostProcessType } from "../view/postProcesses/postProcessTypes";
import { MandelbulbPostProcess } from "../view/postProcesses/mandelbulbPostProcess";
import { Mandelbulb } from "../view/bodies/planemos/mandelbulb";
import { ObjectPostProcess, UpdatablePostProcess } from "../view/postProcesses/objectPostProcess";
import { MatterJetPostProcess } from "../view/postProcesses/matterJetPostProcess";
import { NeutronStar } from "../view/bodies/stellarObjects/neutronStar";
import { ShadowPostProcess } from "../view/postProcesses/shadowPostProcess";

/**
 * The order in which the post processes are rendered when away from a planet
 */
const spaceRenderingOrder: PostProcessType[] = [
    PostProcessType.VOLUMETRIC_LIGHT,
    PostProcessType.MATTER_JETS,
    PostProcessType.OCEAN,
    PostProcessType.CLOUDS,
    PostProcessType.ATMOSPHERE,
    PostProcessType.MANDELBULB,
    PostProcessType.RING,
    PostProcessType.BLACK_HOLE
];

/**
 * The order in which the post processes are rendered when close to a planet
 */
const surfaceRenderingOrder: PostProcessType[] = [
    PostProcessType.VOLUMETRIC_LIGHT,
    PostProcessType.MATTER_JETS,
    PostProcessType.BLACK_HOLE,
    PostProcessType.MANDELBULB,
    PostProcessType.RING,
    PostProcessType.OCEAN,
    PostProcessType.CLOUDS,
    PostProcessType.ATMOSPHERE
];

/**
 * Manages all post processes in the scene.
 * The manager can dynamically create rendering pipelines depending on the current body.
 * This is necessary so the effects are rendered in the correct order. (other objects -> body -> overlays)
 */
export class PostProcessManager {
    private readonly engine: Engine;
    private readonly scene: UberScene;

    private readonly spaceRenderingPipeline: UberRenderingPipeline;
    private readonly surfaceRenderingPipeline: UberRenderingPipeline;
    private currentRenderingPipeline: UberRenderingPipeline;

    private currentRenderingOrder: PostProcessType[] = spaceRenderingOrder;

    private currentBody: AbstractBody | null = null;

    private readonly starFields: StarfieldPostProcess[] = [];
    private readonly volumetricLights: VolumetricLight[] = [];
    private readonly oceans: OceanPostProcess[] = [];
    private readonly clouds: CloudsPostProcess[] = [];
    private readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    private readonly rings: RingsPostProcess[] = [];
    private readonly mandelbulbs: MandelbulbPostProcess[] = [];
    private readonly blackHoles: BlackHolePostProcess[] = [];
    private readonly overlays: OverlayPostProcess[] = [];
    private readonly matterJets: MatterJetPostProcess[] = [];
    private readonly shadows: ShadowPostProcess[] = [];

    /**
     * All post processes that are attached to an object.
     */
    private readonly objectPostProcesses: ObjectPostProcess[][] = [
        this.oceans,
        this.clouds,
        this.atmospheres,
        this.rings,
        this.mandelbulbs,
        this.blackHoles,
        this.overlays,
        this.volumetricLights,
        this.matterJets,
        this.shadows
    ];

    /**
     * All post processes that are updated every frame.
     */
    private readonly updatablePostProcesses: UpdatablePostProcess[][] = [this.starFields, this.volumetricLights, ...this.objectPostProcesses];

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
        this.colorCorrection.exposure = 1.1;
        this.colorCorrection.gamma = 1.2;
        this.colorCorrection.saturation = 0.9;

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
    }

    /**
     * Creates a new Ocean postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addOcean(planet: TelluricPlanemo, stellarObjects: StellarObject[]) {
        const ocean = new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stellarObjects);
        this.oceans.push(ocean);
    }

    /**
     * Returns the ocean post process for the given planet. Throws an error if no ocean is found.
     * @param planet A telluric planet
     */
    public getOcean(planet: TelluricPlanemo): OceanPostProcess | null {
        return this.oceans.find((ocean) => ocean.object === planet) ?? null;
    }

    /**
     * Creates a new Clouds postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addClouds(planet: TelluricPlanemo, stellarObjects: StellarObject[]) {
        const clouds = !Settings.ENABLE_VOLUMETRIC_CLOUDS
            ? new FlatCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stellarObjects)
            : new VolumetricCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stellarObjects);
        this.clouds.push(clouds);
    }

    /**
     * Returns the clouds post process for the given planet. Throws an error if no clouds are found.
     * @param planet A telluric planet
     */
    public getClouds(planet: TelluricPlanemo): CloudsPostProcess | null {
        return this.clouds.find((clouds) => clouds.object === planet) ?? null;
    }

    /**
     * Creates a new Atmosphere postprocess for the given planet and adds it to the manager.
     * @param planet A gas or telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addAtmosphere(planet: GasPlanet | TelluricPlanemo, stellarObjects: StellarObject[]) {
        const atmosphere = new AtmosphericScatteringPostProcess(
            `${planet.name}Atmosphere`,
            planet,
            Settings.ATMOSPHERE_HEIGHT * Math.max(1, planet.model.radius / Settings.EARTH_RADIUS),
            this.scene,
            stellarObjects
        );
        this.atmospheres.push(atmosphere);
    }

    /**
     * Returns the atmosphere post process for the given planet. Throws an error if no atmosphere is found.
     * @param planet A gas or telluric planet
     */
    public getAtmosphere(planet: GasPlanet | TelluricPlanemo): AtmosphericScatteringPostProcess | null {
        return this.atmospheres.find((atmosphere) => atmosphere.object === planet) ?? null;
    }

    /**
     * Creates a Rings postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes
     */
    public addRings(body: AbstractBody, stellarObjects: StellarObject[]) {
        const rings = new RingsPostProcess(body, this.scene, stellarObjects);
        this.rings.push(rings);
    }

    /**
     * Returns the rings post process for the given body. Throws an error if no rings are found.
     * @param body A body
     */
    public getRings(body: AbstractBody): RingsPostProcess | null {
        return this.rings.find((rings) => rings.object === body) ?? null;
    }

    /**
     * Creates a new Mandelbulb postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes
     */
    public addMandelbulb(body: Mandelbulb, stellarObjects: StellarObject[]) {
        const mandelbulb = new MandelbulbPostProcess(body, this.scene, stellarObjects);
        this.mandelbulbs.push(mandelbulb);
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
    public addOverlay(body: BaseObject) {
        const overlay = new OverlayPostProcess(body, this.scene);
        this.overlays.push(overlay);
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
    public getVolumetricLight(star: Star): VolumetricLight | null {
        return this.volumetricLights.find((vl) => vl.object === star) ?? null;
    }

    /**
     * Creates a new BlackHole postprocess for the given black hole and adds it to the manager.
     * @param blackHole A black hole
     */
    public addBlackHole(blackHole: BlackHole) {
        const blackhole = new BlackHolePostProcess(blackHole, this.scene);
        this.blackHoles.push(blackhole);
    }

    public getBlackHole(blackHole: BlackHole): BlackHolePostProcess | null {
        return this.blackHoles.find((bh) => bh.object === blackHole) ?? null;
    }

    public addMatterJet(neutronStar: NeutronStar) {
        this.matterJets.push(new MatterJetPostProcess(neutronStar.name, neutronStar, this.scene));
    }

    public getMatterJet(neutronStar: NeutronStar): MatterJetPostProcess | null {
        return this.matterJets.find((mj) => mj.object === neutronStar) ?? null;
    }

    public addShadowCaster(body: AbstractBody, stellarObjects: StellarObject[]) {
        this.shadows.push(new ShadowPostProcess(body, this.scene, stellarObjects));
    }

    /**
     * Adds all post processes for the given body.
     * @param body A body
     * @param stellarObjects An array of stars or black holes lighting the body
     */
    public addObject(body: AbstractObject, stellarObjects: StellarObject[]) {
        for (const postProcess of body.postProcesses) {
            switch (postProcess) {
                case PostProcessType.RING:
                    if (!(body instanceof AbstractBody)) throw new Error("Rings post process can only be added to bodies. Source:" + body.name);
                    this.addRings(body, stellarObjects);
                    break;
                case PostProcessType.OVERLAY:
                    this.addOverlay(body);
                    break;
                case PostProcessType.ATMOSPHERE:
                    if (!(body instanceof GasPlanet) && !(body instanceof TelluricPlanemo))
                        throw new Error("Atmosphere post process can only be added to gas or telluric planets. Source:" + body.name);
                    this.addAtmosphere(body as GasPlanet | TelluricPlanemo, stellarObjects);
                    break;
                case PostProcessType.CLOUDS:
                    if (!(body instanceof TelluricPlanemo)) throw new Error("Clouds post process can only be added to telluric planets. Source:" + body.name);
                    this.addClouds(body as TelluricPlanemo, stellarObjects);
                    break;
                case PostProcessType.OCEAN:
                    if (!(body instanceof TelluricPlanemo)) throw new Error("Ocean post process can only be added to telluric planets. Source:" + body.name);
                    this.addOcean(body as TelluricPlanemo, stellarObjects);
                    break;
                case PostProcessType.VOLUMETRIC_LIGHT:
                    if (!(body instanceof Star)) throw new Error("Volumetric light post process can only be added to stars. Source:" + body.name);
                    this.addVolumetricLight(body as Star);
                    break;
                case PostProcessType.MANDELBULB:
                    if (!(body instanceof Mandelbulb)) throw new Error("Mandelbulb post process can only be added to mandelbulbs. Source:" + body.name);
                    this.addMandelbulb(body as Mandelbulb, stellarObjects);
                    break;
                case PostProcessType.BLACK_HOLE:
                    if (!(body instanceof BlackHole)) throw new Error("Black hole post process can only be added to black holes. Source:" + body.name);
                    this.addBlackHole(body as BlackHole);
                    break;
                case PostProcessType.MATTER_JETS:
                    if (!(body instanceof NeutronStar)) throw new Error("Matter jets post process can only be added to neutron stars. Source:" + body.name);
                    this.addMatterJet(body as NeutronStar);
                    break;
                case PostProcessType.SHADOW:
                    this.addShadowCaster(body as AbstractBody, stellarObjects);
                    break;
            }
        }
    }

    public setBody(body: AbstractBody) {
        if (this.currentBody === body) return;
        this.currentBody = body;

        this.currentRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.init();
    }

    public setSpaceOrder() {
        if (this.currentRenderingPipeline === this.spaceRenderingPipeline) return;
        this.surfaceRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.currentRenderingPipeline = this.spaceRenderingPipeline;
        this.currentRenderingOrder = spaceRenderingOrder;
        this.init();
    }

    public setSurfaceOrder() {
        if (this.currentRenderingPipeline === this.surfaceRenderingPipeline) return;
        this.spaceRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.currentRenderingPipeline = this.surfaceRenderingPipeline;
        this.currentRenderingOrder = surfaceRenderingOrder;
        this.init();
    }

    public rebuild() {
        // rebuild all volumetric lights FIXME: bug of babylonjs (see commit 539f83f)
        for (const volumetricLight of this.volumetricLights) {
            volumetricLight.dispose();
            this.volumetricLights.splice(this.volumetricLights.indexOf(volumetricLight), 1);
            //for (const light of deletedLights) light.dispose();

            const newVolumetricLight = new VolumetricLight(volumetricLight.object, this.scene);
            this.volumetricLights.push(newVolumetricLight);
        }

        this.init();
    }

    private getCurrentBody() {
        if (this.currentBody === null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    private init() {
        const [otherVolumetricLightsRenderEffect, bodyVolumetricLightsRenderEffect] = makeSplitRenderEffects(
            "VolumetricLights",
            this.getCurrentBody(),
            this.volumetricLights,
            this.engine
        );
        const [otherBlackHolesRenderEffect, bodyBlackHolesRenderEffect] = makeSplitRenderEffects("BlackHoles", this.getCurrentBody(), this.blackHoles, this.engine);
        const [otherOceansRenderEffect, bodyOceansRenderEffect] = makeSplitRenderEffects("Oceans", this.getCurrentBody(), this.oceans, this.engine);
        const [otherCloudsRenderEffect, bodyCloudsRenderEffect] = makeSplitRenderEffects("Clouds", this.getCurrentBody(), this.clouds, this.engine);
        const [otherAtmospheresRenderEffect, bodyAtmospheresRenderEffect] = makeSplitRenderEffects("Atmospheres", this.getCurrentBody(), this.atmospheres, this.engine);
        const [otherRingsRenderEffect, bodyRingsRenderEffect] = makeSplitRenderEffects("Rings", this.getCurrentBody(), this.rings, this.engine);
        const [otherMandelbulbsRenderEffect, bodyMandelbulbsRenderEffect] = makeSplitRenderEffects("Mandelbulbs", this.getCurrentBody(), this.mandelbulbs, this.engine);
        const [otherMatterJetsRenderEffect, bodyMatterJetsRenderEffect] = makeSplitRenderEffects("MatterJets", this.getCurrentBody(), this.matterJets, this.engine);
        const shadowRenderEffect = new PostProcessRenderEffect(this.engine, "ShadowRenderEffect", () => this.shadows);

        this.currentRenderingPipeline.addEffect(this.starFieldRenderEffect);

        for (const postProcessType of this.currentRenderingOrder) {
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
                case PostProcessType.MATTER_JETS:
                    this.currentRenderingPipeline.addEffect(otherMatterJetsRenderEffect);
                    break;
                case PostProcessType.MANDELBULB:
                    this.currentRenderingPipeline.addEffect(otherMandelbulbsRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.currentRenderingPipeline.addEffect(otherShadowRenderEffect);
                    break;
                case PostProcessType.OVERLAY:
                    // do nothing as they are added at the end of the function
                    break;
            }
        }

        for (const postProcessType of this.currentRenderingOrder) {
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
                case PostProcessType.MATTER_JETS:
                    this.currentRenderingPipeline.addEffect(bodyMatterJetsRenderEffect);
                    break;
                case PostProcessType.MANDELBULB:
                    this.currentRenderingPipeline.addEffect(bodyMandelbulbsRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.currentRenderingPipeline.addEffect(bodyShadowRenderEffect);
                    break;
                case PostProcessType.OVERLAY:
                    // do nothing as they are added at the end of the function
                    break;
            }
        }

        this.currentRenderingPipeline.addEffect(shadowRenderEffect);
        this.currentRenderingPipeline.addEffect(this.overlayRenderEffect);
        this.currentRenderingPipeline.addEffect(this.fxaaRenderEffect);
        this.currentRenderingPipeline.addEffect(this.bloomRenderEffect);
        this.currentRenderingPipeline.addEffect(this.colorCorrectionRenderEffect);

        this.currentRenderingPipeline.attachToCamera(this.scene.getActiveUberCamera());
    }

    public update(deltaTime: number) {
        for (const postProcess of this.updatablePostProcesses.flat()) postProcess.update(deltaTime);
    }

    public dispose() {
        for (const objectPostProcess of this.objectPostProcesses.flat()) objectPostProcess.dispose();

        this.colorCorrection.dispose();
        this.fxaa.dispose();

        this.surfaceRenderingPipeline.dispose();
        this.spaceRenderingPipeline.dispose();
    }
}
