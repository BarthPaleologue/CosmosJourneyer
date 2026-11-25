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

import "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Constants } from "@babylonjs/core/Engines/constants";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { BloomEffect } from "@babylonjs/core/PostProcesses/bloomEffect";
import { FxaaPostProcess } from "@babylonjs/core/PostProcesses/fxaaPostProcess";
import type { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { PostProcessRenderEffect } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import { PostProcessRenderPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipeline";
import type { PostProcessRenderPipelineManager } from "@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager";
import type { Scene } from "@babylonjs/core/scene";
import { arraysEqual, assertUnreachable } from "@cosmos-journeyer/typescript";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type {
    JuliaSetModel,
    MandelboxModel,
    MandelbulbModel,
    MengerSpongeModel,
    SierpinskiPyramidModel,
} from "@cosmos-journeyer/universe-model";

import type { HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import type { CelestialBody } from "@/frontend/universe/architecture/orbitalObject";
import type { Transformable } from "@/frontend/universe/architecture/transformable";
import type { GasPlanet } from "@/frontend/universe/planets/gasPlanet/gasPlanet";
import type { TelluricPlanet } from "@/frontend/universe/planets/telluricPlanet/telluricPlanet";
import type { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { BlackHolePostProcess } from "@/frontend/universe/stellarObjects/blackHole/blackHolePostProcess";
import type { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";
import type { Star } from "@/frontend/universe/stellarObjects/star/star";

import type { DepthRendererManager } from "../helpers/depthRendererManager";
import { getProjectedDiameter01 } from "../helpers/isObjectVisibleOnScreen";
import type { StellarLightSources } from "../helpers/stellarLightSystem";
import { CelestialBodyUberShaderPass } from "./celestialBodyUberShader/celestialBodyUberShaderPass";
import { getMatterJetsVisibilityRadius } from "./celestialBodyUberShader/matterJetsSettings";
import { ColorCorrection } from "./colorCorrection";
import { LensFlarePostProcess } from "./lensFlarePostProcess";
import type { RingsUniforms } from "./rings/ringsUniform";
import { SphereShadowsPostProcess } from "./sphereShadowsPostProcess";
import type { UpdatablePostProcess } from "./updatablePostProcess";
import { VolumetricLight } from "./volumetricLight/volumetricLight";

type RenderableBodyEntry = {
    readonly body: Transformable & HasBoundingSphere;
    readonly visibilityRadius: number;
};

/**
 * Manages all post processes in the scene.
 * The manager dynamically creates the rendering pipeline depending on the distance of every body to the active camera.
 * This is necessary so post-processes tied to celestial bodies are rendered from farthest to nearest.
 */
export class PostProcessManager {
    /**
     * The BabylonJS engine
     */
    readonly engine: AbstractEngine;

    /**
     * The scene where the solar system is rendered.
     */
    readonly scene: Scene;

    /**
     * The BabylonJS rendering pipeline manager of the scene
     */
    readonly renderingPipelineManager: PostProcessRenderPipelineManager;

    /**
     * The current rendering pipeline. It is destroyed and recreated every time the camera-relative body order changes.
     */
    private renderingPipeline: PostProcessRenderPipeline;

    private readonly bodyEntries: Array<RenderableBodyEntry> = [];

    private sortedBodies: Array<RenderableBodyEntry> = [];

    private readonly bodyPostProcessesInRenderOrder: Array<PostProcess> = [];

    readonly volumetricLights: Array<PostProcess> = [];
    private readonly lensFlare: LensFlarePostProcess;

    private readonly celestialBodyUberShaders: Array<CelestialBodyUberShaderPass> = [];
    private readonly blackHoles: Array<BlackHolePostProcess> = [];

    /**
     * All post processes that are updated every frame.
     */
    private readonly updatablePostProcesses: Array<Array<UpdatablePostProcess>> = [
        this.celestialBodyUberShaders,
        this.blackHoles,
    ];

    private readonly celestialBodyToPostProcesses = new Map<Transformable, Array<PostProcess>>();

    /**
     * The color correction post process responsible for tone mapping, display encoding, saturation, contrast and brightness.
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

    private readonly bodyRenderEffect: PostProcessRenderEffect;

    private readonly lensFlareRenderEffect: PostProcessRenderEffect;

    readonly sphereShadows: SphereShadowsPostProcess;

    private readonly sphereShadowsRenderEffect: PostProcessRenderEffect;

    private readonly depthRendererManager: DepthRendererManager;

    constructor(depthRendererManager: DepthRendererManager, scene: Scene) {
        this.scene = scene;
        this.engine = scene.getEngine();

        this.depthRendererManager = depthRendererManager;

        this.renderingPipelineManager = scene.postProcessRenderPipelineManager;

        this.colorCorrection = new ColorCorrection("colorCorrection", scene);

        this.fxaa = new FxaaPostProcess(
            "fxaa",
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(
            scene.getEngine(),
            "colorCorrectionRenderEffect",
            () => {
                return [this.colorCorrection.get()];
            },
        );
        this.fxaaRenderEffect = new PostProcessRenderEffect(scene.getEngine(), "fxaaRenderEffect", () => {
            return [this.fxaa];
        });

        this.bloomRenderEffect = new BloomEffect(scene, 1.0, 0.05, 16, Constants.TEXTURETYPE_HALF_FLOAT);
        this.bloomRenderEffect.threshold = 0.0;

        this.lensFlare = new LensFlarePostProcess([], depthRendererManager, scene);
        this.lensFlareRenderEffect = new PostProcessRenderEffect(this.engine, "lensFlareRenderEffect", () =>
            this.lensFlare.get(),
        );

        this.sphereShadows = new SphereShadowsPostProcess(depthRendererManager, scene);
        this.sphereShadowsRenderEffect = new PostProcessRenderEffect(
            scene.getEngine(),
            "sphereShadowsRenderEffect",
            () => [this.sphereShadows.get()],
        );

        this.bodyRenderEffect = new PostProcessRenderEffect(
            scene.getEngine(),
            "bodyRenderEffect",
            () => this.bodyPostProcessesInRenderOrder,
        );

        this.renderingPipeline = this.createPipeline();
    }

    private getRenderSortedBodies(): Array<RenderableBodyEntry> {
        const camera = this.scene.activeCamera;
        if (camera === null) {
            return [...this.bodyEntries];
        }

        return this.bodyEntries
            .filter((bodyEntry) => this.isBodyPostProcessVisible(bodyEntry, camera))
            .sort((a, b) => {
                const aDistance2 = Vector3.DistanceSquared(
                    a.body.getTransform().getAbsolutePosition(),
                    camera.globalPosition,
                );
                const bDistance2 = Vector3.DistanceSquared(
                    b.body.getTransform().getAbsolutePosition(),
                    camera.globalPosition,
                );
                return bDistance2 - aDistance2;
            });
    }

    private getBodyRenderPostProcesses(body: Transformable): Array<PostProcess> {
        return this.celestialBodyToPostProcesses.get(body) ?? [];
    }

    private updateBodyPostProcessesInRenderOrder(): void {
        this.bodyPostProcessesInRenderOrder.length = 0;

        for (const { body } of this.sortedBodies) {
            this.bodyPostProcessesInRenderOrder.push(...this.getBodyRenderPostProcesses(body));
        }
    }

    private isBodyPostProcessVisible(bodyEntry: RenderableBodyEntry, camera: Camera): boolean {
        const screenSizePixels =
            getProjectedDiameter01(
                bodyEntry.body.getTransform().getAbsolutePosition(),
                bodyEntry.visibilityRadius,
                camera.globalPosition,
                camera.fov,
            ) * this.engine.getRenderHeight();
        return screenSizePixels >= 2;
    }

    private getRingsPostProcessRadius(ringsUniforms: RingsUniforms | null): number {
        return ringsUniforms === null ? 0 : ringsUniforms.model.outerRadius;
    }

    private registerBodyPostProcesses(
        body: Transformable & HasBoundingSphere,
        postProcesses: Array<PostProcess>,
        visibilityRadius: number,
    ): void {
        this.bodyEntries.push({ body, visibilityRadius });
        this.celestialBodyToPostProcesses.set(body, postProcesses);
    }

    public addStar(
        star: Star,
        lightSources: ReadonlyArray<DirectionalLight>,
        excludedMeshes: ReadonlyArray<AbstractMesh>,
    ): void {
        const postProcesses: Array<PostProcess> = [];
        const volumetricLight = new VolumetricLight(
            star.mesh,
            star.volumetricLightUniforms,
            excludedMeshes,
            this.scene,
        );
        this.volumetricLights.push(volumetricLight);
        postProcesses.push(volumetricLight);

        if (star.ringsUniforms !== null) {
            const celestialBodyUberShader = new CelestialBodyUberShaderPass(
                {
                    transform: star.getTransform(),
                    boundingRadius: star.getBoundingRadius(),
                    emitsLight: true,
                },
                { rings: star.ringsUniforms },
                { stellarObjects: lightSources, shadowCasters: [] },
                this.depthRendererManager,
                this.scene,
            );
            this.celestialBodyUberShaders.push(celestialBodyUberShader);
            postProcesses.push(celestialBodyUberShader.get());
        }

        this.registerBodyPostProcesses(
            star,
            postProcesses,
            Math.max(star.getBoundingRadius(), this.getRingsPostProcessRadius(star.ringsUniforms)),
        );
    }

    public addNeutronStar(
        neutronStar: NeutronStar,
        lightSources: ReadonlyArray<DirectionalLight>,
        excludedMeshes: ReadonlyArray<AbstractMesh>,
    ): void {
        const postProcesses: Array<PostProcess> = [];
        const volumetricLight = new VolumetricLight(
            neutronStar.mesh,
            neutronStar.volumetricLightUniforms,
            excludedMeshes,
            this.scene,
        );
        this.volumetricLights.push(volumetricLight);
        postProcesses.push(volumetricLight);

        const celestialBodyUberShader = new CelestialBodyUberShaderPass(
            {
                transform: neutronStar.getTransform(),
                boundingRadius: neutronStar.getBoundingRadius(),
                emitsLight: true,
            },
            {
                matterJets: { dipoleTilt: neutronStar.model.dipoleTilt },
                rings: neutronStar.ringsUniforms,
            },
            { stellarObjects: lightSources, shadowCasters: [] },
            this.depthRendererManager,
            this.scene,
        );
        this.celestialBodyUberShaders.push(celestialBodyUberShader);
        postProcesses.push(celestialBodyUberShader.get());

        this.registerBodyPostProcesses(
            neutronStar,
            postProcesses,
            Math.max(
                neutronStar.getBoundingRadius(),
                this.getRingsPostProcessRadius(neutronStar.ringsUniforms),
                getMatterJetsVisibilityRadius(neutronStar.getBoundingRadius()),
            ),
        );
    }

    /**
     * Creates a new BlackHole postprocess for the given black hole and adds it to the manager.
     * @param blackHole A black hole
     */
    public addBlackHole(blackHole: BlackHole): void {
        const blackHolePostProcess = new BlackHolePostProcess(
            blackHole.getTransform(),
            blackHole.blackHoleUniforms,
            this.depthRendererManager,
            this.scene,
        );
        this.blackHoles.push(blackHolePostProcess);

        this.registerBodyPostProcesses(blackHole, [blackHolePostProcess.get()], blackHole.getBoundingRadius());
    }

    public addTelluricPlanet(planet: TelluricPlanet, stellarObjects: ReadonlyArray<DirectionalLight>): void {
        const postProcesses: Array<PostProcess> = [];

        if (
            planet.atmosphereUniforms !== null ||
            planet.cloudsUniforms !== null ||
            planet.oceanUniforms !== null ||
            planet.ringsUniforms !== null
        ) {
            const celestialBodyUberShader = new CelestialBodyUberShaderPass(
                {
                    transform: planet.getTransform(),
                    boundingRadius: planet.getBoundingRadius(),
                    emitsLight: false,
                },
                {
                    atmosphere: planet.atmosphereUniforms,
                    clouds: planet.cloudsUniforms,
                    ocean: planet.oceanUniforms,
                    rings: planet.ringsUniforms,
                },
                { stellarObjects, shadowCasters: [planet] },
                this.depthRendererManager,
                this.scene,
            );
            this.celestialBodyUberShaders.push(celestialBodyUberShader);
            postProcesses.push(celestialBodyUberShader.get());
        }
        this.sphereShadows.addShadowCaster(planet);

        this.registerBodyPostProcesses(
            planet,
            postProcesses,
            Math.max(
                planet.getBoundingRadius(),
                planet.atmosphereUniforms?.atmosphereRadius ?? 0,
                planet.cloudsUniforms?.model.layerRadius ?? 0,
                planet.oceanUniforms?.oceanRadius ?? 0,
                this.getRingsPostProcessRadius(planet.ringsUniforms),
            ),
        );
    }

    public addGasPlanet(planet: GasPlanet, stellarObjects: ReadonlyArray<DirectionalLight>): void {
        const postProcesses: Array<PostProcess> = [];

        const celestialBodyUberShader = new CelestialBodyUberShaderPass(
            {
                transform: planet.getTransform(),
                boundingRadius: planet.getBoundingRadius(),
                emitsLight: false,
            },
            {
                atmosphere: planet.atmosphereUniforms,
                rings: planet.ringsUniforms,
            },
            { stellarObjects, shadowCasters: [planet] },
            this.depthRendererManager,
            this.scene,
        );
        this.celestialBodyUberShaders.push(celestialBodyUberShader);
        postProcesses.push(celestialBodyUberShader.get());

        this.sphereShadows.addShadowCaster(planet);

        this.registerBodyPostProcesses(
            planet,
            postProcesses,
            Math.max(
                planet.getBoundingRadius(),
                planet.atmosphereUniforms.atmosphereRadius,
                this.getRingsPostProcessRadius(planet.ringsUniforms),
            ),
        );
    }

    private addRaymarchedBody(
        body: Transformable & HasBoundingSphere,
        model: DeepReadonly<
            MandelbulbModel | JuliaSetModel | MandelboxModel | SierpinskiPyramidModel | MengerSpongeModel
        >,
        stellarObjects: ReadonlyArray<DirectionalLight>,
        ringsUniforms: RingsUniforms | null,
    ): void {
        const raymarchedBodyPass = new CelestialBodyUberShaderPass(
            {
                transform: body.getTransform(),
                boundingRadius: body.getBoundingRadius(),
                emitsLight: false,
            },
            {
                raymarchedBody: model,
                rings: ringsUniforms,
            },
            { stellarObjects, shadowCasters: [] },
            this.depthRendererManager,
            this.scene,
        );
        this.celestialBodyUberShaders.push(raymarchedBodyPass);

        this.registerBodyPostProcesses(
            body,
            [raymarchedBodyPass.get()],
            Math.max(body.getBoundingRadius(), this.getRingsPostProcessRadius(ringsUniforms)),
        );
    }

    public addCelestialBodies(
        bodies: ReadonlyArray<CelestialBody>,
        stellarLightSources: StellarLightSources,
        excludedMeshes: ReadonlyArray<AbstractMesh>,
    ): void {
        const lightSources = stellarLightSources.getLights();
        for (const object of bodies) {
            switch (object.type) {
                case "star":
                    this.addStar(object, lightSources, excludedMeshes);
                    break;
                case "neutronStar":
                    this.addNeutronStar(object, lightSources, excludedMeshes);
                    break;
                case "blackHole":
                    this.addBlackHole(object);
                    break;
                case "telluricPlanet":
                    this.addTelluricPlanet(object, lightSources);
                    break;
                case "telluricSatellite":
                    this.addTelluricPlanet(object, lightSources);
                    break;
                case "gasPlanet":
                    this.addGasPlanet(object, lightSources);
                    break;
                case "mandelbulb":
                    this.addRaymarchedBody(object, object.model, lightSources, object.ringsUniforms);
                    break;
                case "juliaSet":
                    this.addRaymarchedBody(object, object.model, lightSources, object.ringsUniforms);
                    break;
                case "mandelbox":
                    this.addRaymarchedBody(object, object.model, lightSources, object.ringsUniforms);
                    break;
                case "sierpinskiPyramid":
                    this.addRaymarchedBody(object, object.model, lightSources, object.ringsUniforms);
                    break;
                case "mengerSponge":
                    this.addRaymarchedBody(object, object.model, lightSources, object.ringsUniforms);
                    break;
                default:
                    assertUnreachable(object);
            }
        }

        this.sphereShadows.addStellarLights(lightSources);

        this.lensFlare.setSources(stellarLightSources.getLensFlareSources());

        this.sortedBodies = this.getRenderSortedBodies();
        this.rebuild();
    }

    /**
     * Rebuilds the rendering pipeline with body post-processes ordered from farthest to nearest.
     */
    private rebuild(): void {
        this.renderingPipelineManager.detachCamerasFromRenderPipeline(this.renderingPipeline.name, this.scene.cameras);
        this.renderingPipelineManager.removePipeline(this.renderingPipeline.name);
        this.renderingPipeline.dispose();

        this.updateBodyPostProcessesInRenderOrder();

        this.renderingPipeline = this.createPipeline();
    }

    /** @returns The pipeline attached to the current cameras, including scene-wide effects. */
    private createPipeline(): PostProcessRenderPipeline {
        const pipeline = new PostProcessRenderPipeline(this.engine, "renderingPipeline");
        if (this.bodyEntries.length > 0) {
            pipeline.addEffect(this.sphereShadowsRenderEffect);
            pipeline.addEffect(this.bodyRenderEffect);
        }
        pipeline.addEffect(this.bloomRenderEffect);
        pipeline.addEffect(this.lensFlareRenderEffect);
        pipeline.addEffect(this.colorCorrectionRenderEffect);
        pipeline.addEffect(this.fxaaRenderEffect);

        this.renderingPipelineManager.addPipeline(pipeline);
        this.renderingPipelineManager.attachCamerasToRenderPipeline(pipeline.name, this.scene.cameras);
        return pipeline;
    }

    /**
     * Updates time-dependent post-processes and rebuilds the pipeline if necessary
     * @param deltaSeconds The time in seconds since the last frame
     */
    public update(deltaSeconds: number): void {
        for (const postProcesses of this.updatablePostProcesses) {
            for (const postProcess of postProcesses) {
                postProcess.update(deltaSeconds);
            }
        }

        const sortedBodies = this.getRenderSortedBodies();
        if (arraysEqual(this.sortedBodies, sortedBodies)) {
            return;
        }

        this.sortedBodies = sortedBodies;
        this.rebuild();
    }

    /**
     * Releases body post-processes and clears the system data from scene-wide effects.
     */
    public reset(): void {
        const bodyPostProcesses = this.getBodyPostProcessesToDispose();

        this.volumetricLights.length = 0;
        this.celestialBodyUberShaders.length = 0;
        this.blackHoles.length = 0;

        this.sphereShadows.reset();
        this.lensFlare.setSources([]);

        this.celestialBodyToPostProcesses.clear();
        this.bodyEntries.length = 0;
        this.sortedBodies = [];
        this.rebuild();

        // BabylonJS only detaches a disposed post-process from one camera at a time.
        for (const camera of this.scene.cameras) {
            for (const postProcess of bodyPostProcesses) {
                postProcess.dispose(camera);
            }
        }
    }

    /**
     * @returns The Babylon post-processes created for individual celestial bodies.
     */
    private getBodyPostProcessesToDispose(): Array<PostProcess> {
        return [
            ...this.volumetricLights,
            ...this.celestialBodyUberShaders.map((shader) => shader.get()),
            ...this.blackHoles.map((blackHole) => blackHole.get()),
        ];
    }
}
