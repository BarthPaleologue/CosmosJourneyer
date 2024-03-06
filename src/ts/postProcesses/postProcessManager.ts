//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { UberScene } from "../uberCore/uberScene";
import { OceanPostProcess } from "./oceanPostProcess";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { FlatCloudsPostProcess } from "./clouds/flatCloudsPostProcess";
import { Settings } from "../settings";
import { AtmosphericScatteringPostProcess } from "./atmosphericScatteringPostProcess";
import { RingsPostProcess } from "./rings/ringsPostProcess";
import { StarfieldPostProcess } from "./starfieldPostProcess";
import { VolumetricLight } from "./volumetricLight";
import { BlackHolePostProcess } from "./blackHolePostProcess";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { ColorCorrection } from "../uberCore/postProcesses/colorCorrection";
import { makeSplitRenderEffects } from "../utils/extractRelevantPostProcesses";
import { CloudsPostProcess } from "./volumetricCloudsPostProcess";
import { Engine } from "@babylonjs/core/Engines/engine";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
//import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { PostProcessType } from "./postProcessTypes";
import { MandelbulbPostProcess } from "./mandelbulbPostProcess";
import { ShadowPostProcess } from "./shadowPostProcess";
import { LensFlarePostProcess } from "./lensFlarePostProcess";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { isOrbiting } from "../utils/nearestBody";
import { UpdatablePostProcess } from "./objectPostProcess";
import { MatterJetPostProcess } from "./matterJetPostProcess";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcessRenderPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderPipelineManager } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager";

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

    private readonly renderingPipelineManager: PostProcessRenderPipelineManager;

    private renderingPipeline: PostProcessRenderPipeline;

    private currentRenderingOrder: PostProcessType[] = spaceRenderingOrder;

    private currentBody: CelestialBody | null = null;

    private readonly starFields: StarfieldPostProcess[] = [];
    private readonly volumetricLights: VolumetricLight[] = [];
    private readonly oceans: OceanPostProcess[] = [];
    private readonly clouds: FlatCloudsPostProcess[] = [];
    private readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    private readonly rings: RingsPostProcess[] = [];
    private readonly mandelbulbs: MandelbulbPostProcess[] = [];
    private readonly blackHoles: BlackHolePostProcess[] = [];
    private readonly matterJets: MatterJetPostProcess[] = [];
    private readonly shadows: ShadowPostProcess[] = [];
    private readonly lensFlares: LensFlarePostProcess[] = [];

    /**
     * All post processes that are updated every frame.
     */
    private readonly updatablePostProcesses: UpdatablePostProcess[][] = [this.oceans, this.clouds, this.blackHoles, this.matterJets];

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    private readonly starFieldRenderEffect: PostProcessRenderEffect;

    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    readonly fxaaRenderEffect: PostProcessRenderEffect;

    //readonly bloomRenderEffect: BloomEffect;

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();

        this.renderingPipelineManager = scene.postProcessRenderPipelineManager;

        this.colorCorrection = new ColorCorrection("colorCorrection", scene.getEngine());
        this.colorCorrection.exposure = 1.5;
        this.colorCorrection.gamma = 1.0;
        this.colorCorrection.saturation = 1.2;

        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine());

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "colorCorrectionRenderEffect", () => {
            return [this.colorCorrection];
        });
        this.fxaaRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "fxaaRenderEffect", () => {
            return [this.fxaa];
        });

        this.renderingPipeline = new PostProcessRenderPipeline(scene.getEngine(), "renderingPipeline");
        this.renderingPipelineManager.addPipeline(this.renderingPipeline);

        this.starFieldRenderEffect = new PostProcessRenderEffect(this.engine, "starFieldRenderEffect", () => {
            return this.starFields;
        });

        //this.bloomRenderEffect = new BloomEffect(scene, 1.0, 2.0, 32);
        //this.bloomRenderEffect.threshold = 0.7;
    }

    /**
     * Creates a new Ocean postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addOcean(planet: TelluricPlanet, stellarObjects: StellarObject[]) {
        const ocean = new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stellarObjects);
        this.oceans.push(ocean);
    }

    /**
     * Returns the ocean post process for the given planet. Throws an error if no ocean is found.
     * @param planet A telluric planet
     */
    public getOcean(planet: TelluricPlanet): OceanPostProcess | null {
        return this.oceans.find((ocean) => ocean.object === planet) ?? null;
    }

    /**
     * Creates a new Clouds postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public async addClouds(planet: TelluricPlanet, stellarObjects: StellarObject[]) {
        const uniforms = planet.model.cloudsUniforms;
        if (uniforms === null)
            throw new Error(
                `PostProcessManager: addClouds: uniforms are null. This should not be possible as the postprocess should not be created if the body has no clouds. Body: ${planet.name}`
            );
        return FlatCloudsPostProcess.CreateAsync(`${planet.name}Clouds`, planet, uniforms, this.scene, stellarObjects).then((clouds) => {
            this.clouds.push(clouds);
        });
    }

    /**
     * Returns the clouds post process for the given planet. Throws an error if no clouds are found.
     * @param planet A telluric planet
     */
    public getClouds(planet: TelluricPlanet): CloudsPostProcess | null {
        return this.clouds.find((clouds) => clouds.object === planet) ?? null;
    }

    /**
     * Creates a new Atmosphere postprocess for the given planet and adds it to the manager.
     * @param planet A gas or telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addAtmosphere(planet: GasPlanet | TelluricPlanet, stellarObjects: StellarObject[]) {
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
    public getAtmosphere(planet: GasPlanet | TelluricPlanet): AtmosphericScatteringPostProcess | null {
        return this.atmospheres.find((atmosphere) => atmosphere.object === planet) ?? null;
    }

    /**
     * Creates a Rings postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes
     */
    public async addRings(body: CelestialBody, stellarObjects: StellarObject[]) {
        return RingsPostProcess.CreateAsync(body, this.scene, stellarObjects).then((rings) => {
            this.rings.push(rings);
        });
    }

    /**
     * Returns the rings post process for the given body. Throws an error if no rings are found.
     * @param body A body
     */
    public getRings(body: CelestialBody): RingsPostProcess | null {
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
     * @param starfieldRotation
     */
    public addStarField(stellarObjects: StellarObject[], planets: CelestialBody[], starfieldRotation: Quaternion) {
        this.starFields.push(new StarfieldPostProcess(this.scene, stellarObjects, planets, starfieldRotation));
    }

    /**
     * Creates a new VolumetricLight postprocess for the given star and adds it to the manager.
     * @param star A star
     */
    public addVolumetricLight(star: Star | NeutronStar) {
        this.volumetricLights.push(new VolumetricLight(star, this.scene));
    }

    /**
     * Returns the volumetric light post process for the given star. Throws an error if no volumetric light is found.
     * @param star A star
     */
    public getVolumetricLight(star: Star | NeutronStar): VolumetricLight | null {
        return this.volumetricLights.find((vl) => vl.object === star) ?? null;
    }

    /**
     * Creates a new BlackHole postprocess for the given black hole and adds it to the manager.
     * @param blackHole A black hole
     * @param starfieldRotation
     */
    public addBlackHole(blackHole: BlackHole, starfieldRotation: Quaternion) {
        const blackhole = new BlackHolePostProcess(blackHole, this.scene, starfieldRotation);
        this.blackHoles.push(blackhole);
    }

    public getBlackHole(blackHole: BlackHole): BlackHolePostProcess | null {
        return this.blackHoles.find((bh) => bh.object === blackHole) ?? null;
    }

    public addMatterJet(neutronStar: NeutronStar) {
        console.log("add matter jet");
        this.matterJets.push(new MatterJetPostProcess(neutronStar.name, neutronStar, this.scene));
    }

    public getMatterJet(neutronStar: NeutronStar): MatterJetPostProcess | null {
        return this.matterJets.find((mj) => mj.object === neutronStar) ?? null;
    }

    public async addShadowCaster(body: CelestialBody, stellarObjects: StellarObject[]) {
        return ShadowPostProcess.CreateAsync(body, this.scene, stellarObjects).then((shadow) => {
            this.shadows.push(shadow);
        });
    }

    public addLensFlare(stellarObject: StellarObject) {
        this.lensFlares.push(new LensFlarePostProcess(stellarObject, this.scene));
    }

    public setBody(body: CelestialBody) {
        this.currentBody = body;

        const rings = this.getRings(body);
        const switchLimit = rings !== null ? rings.ringsUniforms.ringStart : 2;
        if (isOrbiting(this.scene.getActiveControls(), body, switchLimit)) this.setSurfaceOrder();
        else this.setSpaceOrder();
    }

    public setSpaceOrder() {
        if (this.currentRenderingOrder === spaceRenderingOrder) return;
        this.currentRenderingOrder = spaceRenderingOrder;
        this.rebuild();
    }

    public setSurfaceOrder() {
        if (this.currentRenderingOrder === surfaceRenderingOrder) return;
        this.currentRenderingOrder = surfaceRenderingOrder;
        this.rebuild();
    }

    private getCurrentBody() {
        if (this.currentBody === null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    public rebuild() {
        this.renderingPipelineManager.detachCamerasFromRenderPipeline(this.renderingPipeline.name, this.scene.cameras);
        this.renderingPipelineManager.removePipeline(this.renderingPipeline.name);
        this.renderingPipeline.dispose();

        this.renderingPipeline = new PostProcessRenderPipeline(this.scene.getEngine(), "renderingPipeline");

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
        const lensFlareRenderEffect = new PostProcessRenderEffect(this.engine, "LensFlareRenderEffect", () => this.lensFlares);

        this.renderingPipeline.addEffect(this.starFieldRenderEffect);

        this.renderingPipeline.addEffect(shadowRenderEffect);

        for (const postProcessType of this.currentRenderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.renderingPipeline.addEffect(otherVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.renderingPipeline.addEffect(otherBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.renderingPipeline.addEffect(otherOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.renderingPipeline.addEffect(otherCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.renderingPipeline.addEffect(otherAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.renderingPipeline.addEffect(otherRingsRenderEffect);
                    break;
                case PostProcessType.MATTER_JETS:
                    this.renderingPipeline.addEffect(otherMatterJetsRenderEffect);
                    break;
                case PostProcessType.MANDELBULB:
                    this.renderingPipeline.addEffect(otherMandelbulbsRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.renderingPipeline.addEffect(otherShadowRenderEffect);
                    break;
                case PostProcessType.LENS_FLARE:
                    //this.renderingPipeline.addEffect(otherLensFlaresRenderEffect);
                    break;
            }
        }

        for (const postProcessType of this.currentRenderingOrder) {
            switch (postProcessType) {
                case PostProcessType.VOLUMETRIC_LIGHT:
                    this.renderingPipeline.addEffect(bodyVolumetricLightsRenderEffect);
                    break;
                case PostProcessType.BLACK_HOLE:
                    this.renderingPipeline.addEffect(bodyBlackHolesRenderEffect);
                    break;
                case PostProcessType.OCEAN:
                    this.renderingPipeline.addEffect(bodyOceansRenderEffect);
                    break;
                case PostProcessType.CLOUDS:
                    this.renderingPipeline.addEffect(bodyCloudsRenderEffect);
                    break;
                case PostProcessType.ATMOSPHERE:
                    this.renderingPipeline.addEffect(bodyAtmospheresRenderEffect);
                    break;
                case PostProcessType.RING:
                    this.renderingPipeline.addEffect(bodyRingsRenderEffect);
                    break;
                case PostProcessType.MATTER_JETS:
                    this.renderingPipeline.addEffect(bodyMatterJetsRenderEffect);
                    break;
                case PostProcessType.MANDELBULB:
                    this.renderingPipeline.addEffect(bodyMandelbulbsRenderEffect);
                    break;
                case PostProcessType.LENS_FLARE:
                    //this.renderingPipeline.addEffect(bodyLensFlaresRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.renderingPipeline.addEffect(bodyShadowRenderEffect);
                    break;
            }
        }

        this.renderingPipeline.addEffect(lensFlareRenderEffect);
        this.renderingPipeline.addEffect(this.fxaaRenderEffect);
        //this.renderingPipeline.addEffect(this.bloomRenderEffect);
        this.renderingPipeline.addEffect(this.colorCorrectionRenderEffect);

        this.renderingPipelineManager.addPipeline(this.renderingPipeline);
        this.renderingPipelineManager.attachCamerasToRenderPipeline(this.renderingPipeline.name, [this.scene.getActiveCamera()]);
    }

    /**
     * Updates all updatable post processes with the given delta time.
     * @param deltaTime The time in seconds since the last frame
     */
    public update(deltaTime: number) {
        for (const postProcess of this.updatablePostProcesses.flat()) postProcess.update(deltaTime);
    }

    public reset() {
        const camera = this.scene.getActiveCamera();

        this.starFields.forEach((starField) => starField.dispose(camera));
        this.starFields.length = 0;

        this.volumetricLights.forEach((volumetricLight) => volumetricLight.dispose(camera));
        this.volumetricLights.length = 0;

        this.oceans.forEach((ocean) => ocean.dispose(camera));
        this.oceans.length = 0;

        this.clouds.forEach((clouds) => clouds.dispose(camera));
        this.clouds.length = 0;

        this.atmospheres.forEach((atmosphere) => atmosphere.dispose(camera));
        this.atmospheres.length = 0;

        this.rings.forEach((rings) => rings.dispose(camera));
        this.rings.length = 0;

        this.mandelbulbs.forEach((mandelbulb) => mandelbulb.dispose(camera));
        this.mandelbulbs.length = 0;

        this.blackHoles.forEach((blackHole) => blackHole.dispose(camera));
        this.blackHoles.length = 0;

        this.matterJets.forEach((matterJet) => matterJet.dispose(camera));
        this.matterJets.length = 0;

        this.shadows.forEach((shadow) => shadow.dispose(camera));
        this.shadows.length = 0;

        this.lensFlares.forEach((lensFlare) => lensFlare.dispose(camera));
        this.lensFlares.length = 0;
    }
}
