import { Vector3 } from "@babylonjs/core";

import { AbstractBody } from "./abstractBody";
import { Star } from "./stars/star";
import { UberScene } from "../core/uberScene";
import { Planet } from "./planets/planet";
import { centeredRand, normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { TelluricPlanet } from "./planets/telluricPlanet";
import { GasPlanet } from "./planets/gasPlanet";
import { clamp } from "../utils/gradientMath";
import { getOrbitalPeriod } from "../orbits/kepler";
import { seededSquirrelNoise } from "squirrel-noise";
import { BlackHole } from "./blackHole";
import { BodyType } from "./interfaces";
import { PostProcessManager } from "../postProcesses/pipelines/postProcessManager";
import { isOrbiting } from "../utils/positionNearBody";
import { nearestBody } from "../utils/nearestBody";

enum Steps {
    GENERATE_STARS = 100,
    GENERATE_PLANETS = 200,
    CHOOSE_PLANET_TYPE = 300
}

export class StarSystem {
    readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    private readonly bodies: AbstractBody[] = [];

    readonly stars: (Star | BlackHole)[] = [];

    readonly planets: Planet[] = [];

    private clock = 0;

    readonly rng: (step: number) => number;

    constructor(seed: number, scene: UberScene) {
        this.scene = scene;
        this.postProcessManager = new PostProcessManager(this.scene);

        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);
    }

    public addBody(body: AbstractBody) {
        this.bodies.push(body);
    }

    public addStar(star: Star | BlackHole): void {
        this.stars.push(star);
    }

    public makeStar(seed = this.rng(Steps.GENERATE_STARS + this.stars.length)): Star {
        const star = new Star(`star${this.stars.length}`, this, this.scene, seed, this.stars);
        //TODO: make this better, make it part of the generation
        star.orbitalProperties.periapsis = star.getRadius() * 4;
        star.orbitalProperties.apoapsis = star.getRadius() * 4;

        this.addBody(star);
        this.addStar(star);
        return star;
    }

    public makeBlackHole(seed = this.rng(Steps.GENERATE_STARS + this.stars.length)): BlackHole {
        const blackHole = new BlackHole(`blackHole${this.stars.length}`, 1000e3, this, seed, this.stars);
        this.addBody(blackHole);
        this.addStar(blackHole);
        return blackHole;
    }

    public makeStars(n: number): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) this.makeStar();

    }

    public makeTelluricPlanet(seed = this.rng(Steps.GENERATE_PLANETS + this.planets.length)): TelluricPlanet {
        const planet = new TelluricPlanet(`telluricPlanet${this.planets.length}`, this, this.scene, seed, this.stars);
        planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;
        //TODO: use formula
        planet.physicalProperties.minTemperature = randRangeInt(-50, 5, planet.rng, 80);
        planet.physicalProperties.maxTemperature = randRangeInt(10, 50, planet.rng, 81);

        planet.material.colorSettings.plainColor.copyFromFloats(
            //TODO: make this better
            Math.max(0.22 + centeredRand(planet.rng, 82) / 20, 0),
            Math.max(0.37 + centeredRand(planet.rng, 83) / 20, 0),
            Math.max(0.024 + centeredRand(planet.rng, 84) / 20, 0)
        );
        planet.material.colorSettings.beachSize = 250 + 100 * centeredRand(planet.rng, 85);
        planet.material.updateConstants();

        this.planets.push(planet);
        this.addBody(planet);

        return planet;
    }

    public makeGasPlanet(seed = this.rng(Steps.GENERATE_PLANETS + this.planets.length)): GasPlanet {
        const planet = new GasPlanet(`gasPlanet`, this, this.scene, seed, this.stars);
        planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;

        this.planets.push(planet);
        this.addBody(planet);

        return planet;
    }

    public makePlanets(n: number): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of planets : ${n}`);
        for (let i = 0; i < n; i++) {
            if (uniformRandBool(0.5, this.rng, Steps.CHOOSE_PLANET_TYPE + this.planets.length)) {
                const planet = this.makeTelluricPlanet();
                this.makeSatellites(planet, randRangeInt(0, 3, planet.rng, 86));
            } else {
                const planet = this.makeGasPlanet();
                this.makeSatellites(planet, randRangeInt(0, 3, planet.rng, 86));
            }
        }
    }

    public makeSatellite(planet: Planet, seed = planet.rng(100)): TelluricPlanet {
        const satellite = new TelluricPlanet(`${planet.name}Sattelite`, this, this.scene, seed, [planet]);
        const periapsis = 2 * planet.getRadius() + clamp(normalRandom(3, 1, satellite.rng, 90), 0, 20) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.rng, 92), 1, 1.5);
        satellite.physicalProperties.mass = 1;
        satellite.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
            orientationQuaternion: satellite.getRotationQuaternion()
        };
        satellite.material.colorSettings.desertColor.copyFromFloats(92 / 255, 92 / 255, 92 / 255);

        this.addBody(satellite);
        return satellite;
    }

    public makeSatellites(planet: Planet, n: number): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        for (let i = 0; i < n; i++) {
            this.makeSatellite(planet);
        }
    }

    public translateAllBodies(deplacement: Vector3): void {
        for (const planet of this.bodies) {
            planet.translate(deplacement);
        }
    }

    /**
     * Returns the list of all celestial bodies managed by the star system manager
     */
    public getBodies(): AbstractBody[] {
        return this.bodies;
    }

    /**
     * Returns the nearest body to the origin
     */
    public getNearestBody(): AbstractBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.getBodies()) {
            if (nearest == null) nearest = body;
            else if (body.getAbsolutePosition().lengthSquared() < nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        if (nearest == null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    /**
     * Returns the most influential body at a given point
     */
    public getMostInfluentialBodyAtPoint(point: Vector3): AbstractBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.bodies) {
            if (nearest == null) nearest = body;
            else if (
                body.physicalProperties.mass / Vector3.DistanceSquared(body.getAbsolutePosition(), point) >
                nearest.physicalProperties.mass / Vector3.DistanceSquared(nearest.getAbsolutePosition(), point)
            ) {
                nearest = body;
            }
        }
        if (nearest == null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    public getTime() {
        return this.clock;
    }

    public init() {
        this.initPostProcesses();
        this.update(Date.now() / 1000);
    }

    public initPostProcesses() {
        this.postProcessManager.addStarField(this.stars, this.planets);

        for (const body of this.bodies) {
            if (body.postProcesses.rings) this.postProcessManager.addRings(body, this.stars);
            if (body.postProcesses.overlay) this.postProcessManager.addOverlay(body);
            switch (body.bodyType) {
                case BodyType.STAR:
                    const star = body as Star;
                    if (star.postProcesses.volumetricLight) this.postProcessManager.addVolumetricLight(star);
                    break;
                case BodyType.TELLURIC:
                    const telluric = body as TelluricPlanet;
                    if (telluric.postProcesses.atmosphere) this.postProcessManager.addAtmosphere(telluric, this.stars);
                    if (telluric.postProcesses.clouds) this.postProcessManager.addClouds(telluric, this.stars);
                    if (telluric.postProcesses.ocean) this.postProcessManager.addOcean(telluric, this.stars);
                    break;
                case BodyType.GAZ:
                    const gas = body as GasPlanet;
                    if (gas.postProcesses.atmosphere) this.postProcessManager.addAtmosphere(gas, this.stars);
                    break;
                case BodyType.BLACK_HOLE:
                    const blackHole = body as BlackHole;
                    if (blackHole.postProcesses.blackHole) this.postProcessManager.addBlackHole(blackHole);
                    break;
                default:
                    throw new Error(`Unknown body type : ${body.bodyType}`);
            }
        }
        this.postProcessManager.setBody(nearestBody(this.scene.getActiveController().transform, this.bodies));
        this.postProcessManager.init();
    }

    public update(deltaTime: number): void {
        this.clock += deltaTime;

        for (const body of this.getBodies()) body.updateTransform(this.scene.getActiveController(), deltaTime);

        const displacement = this.scene.getActiveController().transform.getAbsolutePosition().negate();

        this.translateAllBodies(displacement);
        this.scene.getActiveController().transform.translate(displacement);


        const nearest = nearestBody(this.scene.getActiveController().transform, this.bodies);

        this.postProcessManager.setBody(nearest);

        const switchLimit = 2;//nearestBody.postProcesses.rings?.settings.ringStart || 2;
        if (isOrbiting(this.scene.getActiveController(), nearest, switchLimit)) {
            this.postProcessManager.setSurfaceOrder();
        } else {
            this.postProcessManager.setSpaceOrder();
        }
        this.postProcessManager.update(deltaTime);
    }
}
