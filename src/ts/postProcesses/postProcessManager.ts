//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { UberScene } from "../uberCore/uberScene";
import { OceanPostProcess } from "./oceanPostProcess";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { FlatCloudsPostProcess } from "../clouds/flatCloudsPostProcess";
import { Settings } from "../settings";
import { AtmosphericScatteringPostProcess } from "./atmosphericScatteringPostProcess";
import { RingsPostProcess } from "../rings/ringsPostProcess";
import { VolumetricLight } from "./volumetricLight";
import { BlackHolePostProcess } from "../stellarObjects/blackHole/blackHolePostProcess";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { ColorCorrection } from "./colorCorrection";
import { makeSplitRenderEffects } from "../utils/extractRelevantPostProcesses";
import { CloudsPostProcess } from "../clouds/volumetricCloudsPostProcess";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";
import { PostProcessType } from "./postProcessTypes";
import { MandelbulbPostProcess } from "../anomalies/mandelbulb/mandelbulbPostProcess";
import { ShadowPostProcess } from "./shadowPostProcess";
import { LensFlarePostProcess } from "./lensFlarePostProcess";
import { UpdatablePostProcess } from "./objectPostProcess";
import { MatterJetPostProcess } from "./matterJetPostProcess";
import { Mandelbulb } from "../anomalies/mandelbulb/mandelbulb";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcessRenderPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderPipelineManager } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager";
import { JuliaSetPostProcess } from "../anomalies/julia/juliaSetPostProcess";
import { JuliaSet } from "../anomalies/julia/juliaSet";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { Constants } from "@babylonjs/core/Engines/constants";
import { PlanetaryMassObject } from "../architecture/planetaryMassObject";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
    PostProcessType.JULIA_SET,
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
    PostProcessType.JULIA_SET,
    PostProcessType.RING,
    PostProcessType.OCEAN,
    PostProcessType.CLOUDS,
    PostProcessType.ATMOSPHERE
];

/**
 * Manages all post processes in the scene.
 * The manager dynamically creates the rendering pipeline depending on the current body.
 * This is necessary so the effects are rendered in the correct order. (other objects -> body -> overlays)
 */
export class PostProcessManager {
    /**
     * The BabylonJS engine
     */
    readonly engine: AbstractEngine;

    /**
     * The scene where the solar system is rendered.
     * It needs to use the wrapper as the post-processes need the depth renderer of the scene.
     */
    readonly scene: UberScene;

    /**
     * The BabylonJS rendering pipeline manager of the scene
     */
    readonly renderingPipelineManager: PostProcessRenderPipelineManager;

    /**
     * The current rendering pipeline. It is destroyed and recreated every time the closest orbital object changes or when the camera changes.
     * @private
     */
    private renderingPipeline: PostProcessRenderPipeline;

    /**
     * The order in which to add the post-processes to the rendering pipeline. This is important as this order determines the rendering order.
     * For now, there are 2 different orders: one when in space, and one when close to a planet.
     * @private
     */
    private currentRenderingOrder: PostProcessType[] = spaceRenderingOrder;

    /**
     * The closest celestial body to the active camera. This is useful to split post-processes that are specific to a body from the others.
     * @private
     */
    private currentBody: CelestialBody | null = null;

    private readonly volumetricLights: VolumetricLight[] = [];
    private readonly oceans: OceanPostProcess[] = [];
    private readonly clouds: FlatCloudsPostProcess[] = [];
    private readonly atmospheres: AtmosphericScatteringPostProcess[] = [];
    private readonly rings: RingsPostProcess[] = [];
    private readonly mandelbulbs: MandelbulbPostProcess[] = [];
    private readonly juliaSets: JuliaSetPostProcess[] = [];
    private readonly blackHoles: BlackHolePostProcess[] = [];
    private readonly matterJets: MatterJetPostProcess[] = [];
    private readonly shadows: ShadowPostProcess[] = [];
    private readonly lensFlares: LensFlarePostProcess[] = [];

    private readonly objectPostProcesses: PostProcess[][] = [
        this.volumetricLights,
        this.oceans,
        this.clouds,
        this.atmospheres,
        this.rings,
        this.mandelbulbs,
        this.juliaSets,
        this.blackHoles,
        this.matterJets,
        this.shadows,
        this.lensFlares
    ];

    /**
     * All post processes that are updated every frame.
     */
    private readonly updatablePostProcesses: UpdatablePostProcess[][] = [this.oceans, this.clouds, this.blackHoles, this.matterJets, this.mandelbulbs, this.juliaSets];

    /**
     * The color correction post process responsible for tone mapping, saturation, contrast, brightness and gamma.
     */
    readonly colorCorrection: ColorCorrection;

    /**
     * The FXAA post process responsible for antialiasing.
     */
    readonly fxaa: FxaaPostProcess;

    /**
     * The effect storing the color correction post process.
     */
    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;

    /**
     * The effect storing the FXAA post process.
     */
    readonly fxaaRenderEffect: PostProcessRenderEffect;

    readonly bloomRenderEffect: BloomEffect;

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();

        this.renderingPipelineManager = scene.postProcessRenderPipelineManager;

        this.colorCorrection = new ColorCorrection("colorCorrection", scene);
        this.colorCorrection.exposure = 1.1;
        this.colorCorrection.gamma = 1.0;
        this.colorCorrection.saturation = 1.5;

        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, Constants.TEXTURETYPE_HALF_FLOAT);

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "colorCorrectionRenderEffect", () => {
            return [this.colorCorrection];
        });
        this.fxaaRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "fxaaRenderEffect", () => {
            return [this.fxaa];
        });

        this.renderingPipeline = new PostProcessRenderPipeline(scene.getEngine(), "renderingPipeline");
        this.renderingPipelineManager.addPipeline(this.renderingPipeline);

        this.bloomRenderEffect = new BloomEffect(scene, 1.0, 0.3, 32, Constants.TEXTURETYPE_HALF_FLOAT);
        this.bloomRenderEffect.threshold = 0.0;
    }

    /**
     * Creates a new Ocean postprocess for the given planet and adds it to the manager.
     * @param planet A telluric planet
     * @param stellarObjects An array of stars or black holes
     */
    public addOcean(planet: TelluricPlanet, stellarObjects: StellarObject[]) {
        const ocean = new OceanPostProcess(planet, stellarObjects, this.scene);
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
    public addClouds(planet: TelluricPlanet, stellarObjects: StellarObject[]) {
        const uniforms = planet.getCloudsUniforms();
        if (uniforms === null)
            throw new Error(
                `PostProcessManager: addClouds: uniforms are null. This should not be possible as the postprocess should not be created if the body has no clouds. Body: ${planet.model.name}`
            );
        this.clouds.push(new FlatCloudsPostProcess(planet, uniforms, stellarObjects, this.scene));
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
            planet,
            Settings.EARTH_ATMOSPHERE_THICKNESS * Math.max(1, planet.model.radius / Settings.EARTH_RADIUS),
            stellarObjects,
            this.scene
        );
        this.atmospheres.push(atmosphere);
    }

    /**
     * Returns the atmosphere post process for the given planet. Throws an error if no atmosphere is found.
     * @param planet A gas or telluric planet
     */
    public getAtmosphere(planet: PlanetaryMassObject): AtmosphericScatteringPostProcess | null {
        return this.atmospheres.find((atmosphere) => atmosphere.object === planet) ?? null;
    }

    /**
     * Creates a Rings postprocess for the given body and adds it to the manager.
     * @param body A body
     * @param stellarObjects An array of stars or black holes
     */
    public addRings(body: CelestialBody, stellarObjects: StellarObject[]) {
        this.rings.push(new RingsPostProcess(body, stellarObjects, this.scene));
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
        this.mandelbulbs.push(new MandelbulbPostProcess(body, this.scene, stellarObjects));
    }

    /**
     * Creates a new Julia set postprocess for the given julia set and adds it to the manager.
     * @param juliaSet A julia set
     * @param stellarObjects An array of stars or black holes
     */
    public addJuliaSet(juliaSet: JuliaSet, stellarObjects: StellarObject[]) {
        this.juliaSets.push(new JuliaSetPostProcess(juliaSet, this.scene, stellarObjects));
    }

    /**
     * Creates a new VolumetricLight postprocess for the given star and adds it to the manager.
     * @param star A star
     * @param excludedMeshes
     */
    public addVolumetricLight(star: Star | NeutronStar, excludedMeshes: AbstractMesh[]) {
        this.volumetricLights.push(new VolumetricLight(star, excludedMeshes, this.scene));
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
     */
    public addBlackHole(blackHole: BlackHole) {
        this.blackHoles.push(new BlackHolePostProcess(blackHole, this.scene));
    }

    /**
     * Returns the black hole post process for the given black hole. Throws an error if no black hole is found.
     * @param blackHole A black hole
     */
    public getBlackHole(blackHole: BlackHole): BlackHolePostProcess | null {
        return this.blackHoles.find((bh) => bh.object === blackHole) ?? null;
    }

    /**
     * Creates a new MatterJet postprocess for the given neutron star and adds it to the manager.
     * @param neutronStar A neutron star
     */
    public addMatterJet(neutronStar: NeutronStar) {
        this.matterJets.push(new MatterJetPostProcess(neutronStar, this.scene));
    }

    /**
     * Returns the matter jet post process for the given neutron star. Throws an error if no matter jet is found.
     * @param neutronStar A neutron star
     */
    public getMatterJet(neutronStar: NeutronStar): MatterJetPostProcess | null {
        return this.matterJets.find((mj) => mj.object === neutronStar) ?? null;
    }

    /**
     * Creates a new Shadow postprocess for the given body and adds it to the manager.
     * @param body A celestial body
     * @param stellarObjects An array of stellar objects
     */
    public addShadowCaster(body: CelestialBody, stellarObjects: StellarObject[]) {
        this.shadows.push(new ShadowPostProcess(body, stellarObjects, this.scene));
    }

    /**
     * Creates a new LensFlare postprocess for the given stellar object and adds it to the manager.
     * @param stellarObject A stellar object (usually a star or a neutron star)
     */
    public addLensFlare(stellarObject: StellarObject) {
        this.lensFlares.push(new LensFlarePostProcess(stellarObject, this.scene));
    }

    /**
     * Sets the current celestial body of the post process manager.
     * It should be the closest body to the active camera, in order to split the post processes that are specific to this body from the others.
     * This method will also choose the appropriate rendering order and rebuild the pipeline.
     * @param body The closest celestial body to the active camera
     */
    public setCelestialBody(body: CelestialBody) {
        this.currentBody = body;

        const rings = this.getRings(body);
        const switchLimit = rings !== null ? rings.ringsUniforms.model.ringStart : 2;
        const distance2 = Vector3.DistanceSquared(body.getTransform().getAbsolutePosition(), this.scene.getActiveControls().getTransform().getAbsolutePosition());
        if (distance2 < (switchLimit * body.getBoundingRadius()) ** 2) this.setSurfaceOrder();
        else this.setSpaceOrder();
    }

    /**
     * Sets the rendering order to the space rendering order and rebuilds the pipeline.
     */
    public setSpaceOrder() {
        if (this.currentRenderingOrder === spaceRenderingOrder) return;
        this.currentRenderingOrder = spaceRenderingOrder;
        this.rebuild();
    }

    /**
     * Sets the rendering order to the surface rendering order and rebuilds the pipeline.
     */
    public setSurfaceOrder() {
        if (this.currentRenderingOrder === surfaceRenderingOrder) return;
        this.currentRenderingOrder = surfaceRenderingOrder;
        this.rebuild();
    }

    /**
     * Returns the current celestial body, or throws an error if it is null.
     * @private
     */
    private getCurrentBody() {
        if (this.currentBody === null) throw new Error("No body set to the postProcessManager");
        return this.currentBody;
    }

    /**
     * Rebuilds the rendering pipeline with the current rendering order.
     */
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
        const [otherJuliaSetsRenderEffect, bodyJuliaSetRenderEffect] = makeSplitRenderEffects("JuliaSets", this.getCurrentBody(), this.juliaSets, this.engine);
        const [otherMatterJetsRenderEffect, bodyMatterJetsRenderEffect] = makeSplitRenderEffects("MatterJets", this.getCurrentBody(), this.matterJets, this.engine);
        const shadowRenderEffect = new PostProcessRenderEffect(this.engine, "ShadowRenderEffect", () => this.shadows);
        const lensFlareRenderEffect = new PostProcessRenderEffect(this.engine, "LensFlareRenderEffect", () => this.lensFlares);

        this.renderingPipeline.addEffect(shadowRenderEffect);

        // other objects are viewed in their space configuration
        for (const postProcessType of spaceRenderingOrder) {
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
                case PostProcessType.JULIA_SET:
                    this.renderingPipeline.addEffect(otherJuliaSetsRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.renderingPipeline.addEffect(otherShadowRenderEffect);
                    break;
                case PostProcessType.LENS_FLARE:
                    //this.renderingPipeline.addEffect(otherLensFlaresRenderEffect);
                    break;
            }
        }

        // closest object is either in surface or space configuration depending on distance to camera
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
                case PostProcessType.JULIA_SET:
                    this.renderingPipeline.addEffect(bodyJuliaSetRenderEffect);
                    break;
                case PostProcessType.LENS_FLARE:
                    //this.renderingPipeline.addEffect(bodyLensFlaresRenderEffect);
                    break;
                case PostProcessType.SHADOW:
                    //this.renderingPipeline.addEffect(bodyShadowRenderEffect);
                    break;
            }
        }

        this.renderingPipeline.addEffect(this.bloomRenderEffect);
        this.renderingPipeline.addEffect(lensFlareRenderEffect);
        this.renderingPipeline.addEffect(this.fxaaRenderEffect);
        //this.renderingPipeline.addEffect(this.bloomRenderEffect);
        this.renderingPipeline.addEffect(this.colorCorrectionRenderEffect);

        this.renderingPipelineManager.addPipeline(this.renderingPipeline);
        this.renderingPipelineManager.attachCamerasToRenderPipeline(this.renderingPipeline.name, this.scene.cameras);
    }

    /**
     * Updates all updatable post processes with the given delta time.
     * @param deltaTime The time in seconds since the last frame
     */
    public update(deltaTime: number) {
        for (const postProcess of this.updatablePostProcesses.flat()) postProcess.update(deltaTime);
    }

    /**
     * Disposes of all post-processes tied to a star system (everything except color correction and FXAA).
     * The pipeline is not destroyed as it is always destroyed and recreated when the closest orbital object changes.
     */
    public reset() {
        // disposing on every camera is necessary because BabylonJS only detaches the post-processes from a single camera at a time
        this.scene.cameras.forEach((camera) => {
            this.objectPostProcesses.forEach((postProcessList) => {
                postProcessList.forEach((postProcess) => {
                    postProcess.dispose(camera);
                });
            });
        });

        this.objectPostProcesses.forEach((postProcessList) => {
            postProcessList.length = 0;
        });
    }
}
