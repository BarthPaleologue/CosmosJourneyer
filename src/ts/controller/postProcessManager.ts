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
import { extractRelevantPostProcesses } from "../utils/extractRelevantPostProcesses";
import { CloudsPostProcess, VolumetricCloudsPostProcess } from "../view/postProcesses/volumetricCloudsPostProcess";
import { StellarObject } from "../view/bodies/stellarObjects/stellarObject";
import { Engine } from "@babylonjs/core/Engines/engine";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { AbstractObject } from "../view/bodies/abstractObject";
import { BaseObject } from "../model/orbits/iOrbitalObject";
import { PostProcessType } from "../view/postProcesses/postProcessTypes";
import { MandelbulbPostProcess } from "../view/postProcesses/mandelbulbPostProcess";
import { Mandelbulb } from "../view/bodies/planemos/mandelbulb";

const spaceRenderingOrder: PostProcessType[] = [
    PostProcessType.VOLUMETRIC_LIGHT,
    PostProcessType.OCEAN,
    PostProcessType.CLOUDS,
    PostProcessType.ATMOSPHERE,
    PostProcessType.MANDELBULB,
    PostProcessType.RING,
    PostProcessType.BLACK_HOLE
];

const surfaceRenderingOrder: PostProcessType[] = [
    PostProcessType.VOLUMETRIC_LIGHT,
    PostProcessType.BLACK_HOLE,
    PostProcessType.MANDELBULB,
    PostProcessType.RING,
    PostProcessType.OCEAN,
    PostProcessType.CLOUDS,
    PostProcessType.ATMOSPHERE
];

export class PostProcessManager {
    private readonly engine: Engine;
    private readonly scene: UberScene;

    private readonly spaceRenderingPipeline: UberRenderingPipeline;
    private readonly surfaceRenderingPipeline: UberRenderingPipeline;
    private currentRenderingPipeline: UberRenderingPipeline;

    private renderingOrder: PostProcessType[] = spaceRenderingOrder;

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
        this.oceans.push(new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stellarObjects));
    }

    /**
     * Returns the ocean post process for the given planet. Throws an error if no ocean is found.
     * @param planet A telluric planet
     */
    public getOcean(planet: TelluricPlanemo): OceanPostProcess | null {
        for (const ocean of this.oceans) if (ocean.object === planet) return ocean;
        return null;
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
    public getClouds(planet: TelluricPlanemo): CloudsPostProcess | null {
        for (const clouds of this.clouds) if (clouds.object === planet) return clouds;
        return null;
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
                Settings.ATMOSPHERE_HEIGHT * Math.max(1, planet.model.radius / Settings.EARTH_RADIUS),
                this.scene,
                stellarObjects
            )
        );
    }

    /**
     * Returns the atmosphere post process for the given planet. Throws an error if no atmosphere is found.
     * @param planet A gas or telluric planet
     */
    public getAtmosphere(planet: GasPlanet | TelluricPlanemo): AtmosphericScatteringPostProcess | null {
        for (const atmosphere of this.atmospheres) if (atmosphere.object === planet) return atmosphere;
        return null;
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
    public getRings(body: AbstractBody): RingsPostProcess | null {
        for (const rings of this.rings) if (rings.object === body) return rings;
        return null;
    }

    /**
     * Creates a new Mandelbulb postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes 
     */
    public addMandelbulb(body: Mandelbulb, stellarObjects: StellarObject[]) {
        this.mandelbulbs.push(new MandelbulbPostProcess(body, this.scene, stellarObjects));
    }

    /**
     * Returns the mandelbulb post process for the given body. Throws an error if no mandelbulb is found.
     * @param body A body
     * @returns
     * @memberof PostProcessManager
     */
    public getMandelbulb(body: Mandelbulb): MandelbulbPostProcess | null {
        for (const mandelbulb of this.mandelbulbs) if (mandelbulb.object === body) return mandelbulb;
        return null;
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
    public getVolumetricLight(star: Star): VolumetricLight | null {
        for (const volumetricLight of this.volumetricLights) if (volumetricLight.body === star) return volumetricLight;
        return null;
    }

    /**
     * Creates a new BlackHole postprocess for the given black hole and adds it to the manager.
     * @param blackHole A black hole
     */
    public addBlackHole(blackHole: BlackHole) {
        this.blackHoles.push(new BlackHolePostProcess(blackHole.name, blackHole, this.scene));
    }

    public getBlackHole(blackHole: BlackHole): BlackHolePostProcess | null {
        for (const bh of this.blackHoles) if (bh.object === blackHole) return bh;
        return null;
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
                default:
                    throw new Error("Invalid postprocess type: " + postProcess);
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
        this.renderingOrder = spaceRenderingOrder;
        this.init();
    }

    public setSurfaceOrder() {
        if (this.currentRenderingPipeline === this.surfaceRenderingPipeline) return;
        this.spaceRenderingPipeline.detachCamera(this.scene.getActiveUberCamera());
        this.currentRenderingPipeline = this.surfaceRenderingPipeline;
        this.renderingOrder = surfaceRenderingOrder;
        this.init();
    }

    public rebuild(oldCamera: Camera) {
        // rebuild all volumetric lights FIXME: bug of babylonjs
        for (const volumetricLight of this.volumetricLights) {
            volumetricLight.dispose(oldCamera);
            this.volumetricLights.splice(this.volumetricLights.indexOf(volumetricLight), 1);

            const newVolumetricLight = new VolumetricLight(volumetricLight.body, this.scene);
            this.volumetricLights.push(newVolumetricLight);
        }

        this.init();
    }

    private getCurrentBody() {
        if (this.currentBody === null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    private init() {
        const bodyVolumetricLights: VolumetricLight[] = [];
        const otherVolumetricLights: VolumetricLight[] = [];
        for (const volumetricLight of this.volumetricLights) {
            if (volumetricLight.body === this.getCurrentBody()) bodyVolumetricLights.push(volumetricLight);
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

        const [bodyMandelbulbs, otherMandelbulbs] = extractRelevantPostProcesses(this.mandelbulbs, this.getCurrentBody());
        const otherMandelbulbsRenderEffect = new PostProcessRenderEffect(this.engine, "otherMandelbulbsRenderEffect", () => {
            return otherMandelbulbs;
        });
        const bodyMandelbulbsRenderEffect = new PostProcessRenderEffect(this.engine, "bodyMandelbulbsRenderEffect", () => {
            return bodyMandelbulbs;
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
                case PostProcessType.MANDELBULB:
                    this.currentRenderingPipeline.addEffect(otherMandelbulbsRenderEffect);
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
                case PostProcessType.MANDELBULB:
                    this.currentRenderingPipeline.addEffect(bodyMandelbulbsRenderEffect);
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

    public dispose() {
        for (const ring of this.rings) ring.dispose();
        for (const volumetricLight of this.volumetricLights) volumetricLight.dispose(this.scene.getActiveUberCamera());
        for (const atmosphere of this.atmospheres) atmosphere.dispose();
        for (const clouds of this.clouds) clouds.dispose();
        for (const oceans of this.oceans) oceans.dispose();
        for (const blackhole of this.blackHoles) blackhole.dispose();

        this.colorCorrection.dispose();
        this.fxaa.dispose();

        this.surfaceRenderingPipeline.dispose();
        this.spaceRenderingPipeline.dispose();
    }
}
