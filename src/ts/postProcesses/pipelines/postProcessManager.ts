import { UberScene } from "../../core/uberScene";
import { UberRenderingPipeline } from "./uberRenderingPipeline";
import { Engine, PostProcess, PostProcessRenderEffect } from "@babylonjs/core";
import { OceanPostProcess } from "../planetPostProcesses/oceanPostProcess";
import { TelluricPlanet } from "../../bodies/planets/telluricPlanet";
import { Star } from "../../bodies/stars/star";
import { BlackHole } from "../../bodies/blackHole";
import { FlatCloudsPostProcess } from "../planetPostProcesses/flatCloudsPostProcess";
import { Settings } from "../../settings";
import { AtmosphericScatteringPostProcess } from "../planetPostProcesses/atmosphericScatteringPostProcess";
import { Planet } from "../../bodies/planets/planet";
import { AbstractBody } from "../../bodies/abstractBody";
import { RingsPostProcess } from "../planetPostProcesses/ringsPostProcess";
import { StarfieldPostProcess } from "../starfieldPostProcess";
import { OverlayPostProcess } from "../overlayPostProcess";
import { VolumetricLight } from "../volumetricLight";
import { BlackHolePostProcess } from "../planetPostProcesses/blackHolePostProcess";

export class PostProcessManager {
    engine: Engine;
    scene: UberScene;
    uberRenderingPipeline: UberRenderingPipeline;

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

    constructor(scene: UberScene) {
        this.scene = scene;
        this.engine = scene.getEngine();
        this.uberRenderingPipeline = scene.uberRenderingPipeline;

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

    public addOcean(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.oceans.push(new OceanPostProcess(`${planet.name}Ocean`, planet, this.scene, stars));
    }

    public addClouds(planet: TelluricPlanet, stars: (Star | BlackHole)[]) {
        this.clouds.push(new FlatCloudsPostProcess(`${planet.name}Clouds`, planet, Settings.CLOUD_LAYER_HEIGHT, this.scene, stars));
    }

    public addAtmosphere(planet: Planet, stars: (Star | BlackHole)[]) {
        this.atmospheres.push(new AtmosphericScatteringPostProcess(`${planet.name}Atmosphere`, planet, Settings.ATMOSPHERE_HEIGHT, this.scene, stars));
    }

    public addRings(body: AbstractBody, stars: (Star | BlackHole)[]) {
        this.rings.push(new RingsPostProcess(`${body.name}Rings`, body, this.scene, stars));
    }

    public addStarField(stars: (Star | BlackHole)[]) {
        this.starFields.push(new StarfieldPostProcess("starField", this.scene, stars));
    }

    public addOverlay(body: AbstractBody) {
        this.overlays.push(new OverlayPostProcess(body.name, body, this.scene));
    }

    public addVolumetricLight(star: Star) {
        this.volumetricLights.push(new VolumetricLight(star, star.mesh, this.scene));
    }

    public addBlackHole(blackHole: BlackHole) {
        this.blackHoles.push(new BlackHolePostProcess(blackHole.name, blackHole, this.scene));
    }

    public init() {
        //TODO: create here the render effect and disconnect ubercore from the rest
        this.uberRenderingPipeline.oceans.push(...this.oceans);
        this.uberRenderingPipeline.clouds.push(...this.clouds);
        this.uberRenderingPipeline.atmospheres.push(...this.atmospheres);
        this.uberRenderingPipeline.rings.push(...this.rings);
        this.uberRenderingPipeline.starFields.push(...this.starFields);
        this.uberRenderingPipeline.overlays.push(...this.overlays);
        this.uberRenderingPipeline.volumetricLights.push(...this.volumetricLights);
        this.uberRenderingPipeline.blackHoles.push(...this.blackHoles);
    }
}