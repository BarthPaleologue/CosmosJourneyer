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

enum Steps {
    GENERATE_STARS=100,
    GENERATE_PLANETS=200,
    CHOOSE_PLANET_TYPE=300,
}

export class StarSystem {
    readonly scene: UberScene;
    private readonly bodies: AbstractBody[] = [];

    readonly stars: Star[] = [];

    readonly planets: Planet[] = [];

    private clock = 0;

    readonly rng: (step: number) => number;

    constructor(seed: number, scene: UberScene) {
        this.scene = scene;
        this.rng = seededSquirrelNoise(seed * Number.MAX_SAFE_INTEGER);
    }

    public addBody(body: AbstractBody) {
        this.bodies.push(body);
    }

    public addStar(star: Star): void {
        this.stars.push(star);
        //this.bodies.push(star);
    }

    public makeStars(n: number): void {
        if(n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) {
            const star = new Star(`star${i}`, this, this.rng(Steps.GENERATE_STARS + this.stars.length), this.stars);
            //TODO: make this better, make it part of the generation
            star.orbitalProperties.periapsis = star.getRadius() * 4;
            star.orbitalProperties.apoapsis = star.getRadius() * 4;
        }
    }

    public makeTelluricPlanet(): void {
        const planet = new TelluricPlanet(`telluricPlanet`, this, this.rng(Steps.GENERATE_PLANETS + this.planets.length), this.stars);
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
        this.makeSatellites(planet, randRangeInt(1, 3, planet.rng, 86));
    }

    public makeGasPlanet(): void {
        const planet = new GasPlanet(`gasPlanet`, this, this.rng(Steps.GENERATE_PLANETS + this.planets.length), this.stars);
        planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;
        this.makeSatellites(planet, randRangeInt(0, 3, planet.rng, 86));
    }

    public makePlanets(n: number): void {
        if(n < 0) throw new Error(`Cannot make a negative amount of planets : ${n}`);
        for (let i = 0; i < n; i++) {
            if(uniformRandBool(0.5, this.rng, Steps.CHOOSE_PLANET_TYPE + this.planets.length)) {
                this.makeTelluricPlanet()
            } else {
                this.makeGasPlanet()
            }
        }
    }

    public makeSatellite(planet: Planet): void {
        const satellite = new TelluricPlanet(`${planet.name}Sattelite`, this, planet.rng(100), [planet]);
        const periapsis = 5 * planet.getRadius() + clamp(normalRandom(10, 1, satellite.rng, 90), -2, 20) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.rng, 92), 1, 1.5);
        satellite.physicalProperties.mass = 1;
        satellite.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
            orientationQuaternion: satellite.getRotationQuaternion()
        };
        satellite.material.colorSettings.desertColor.copyFromFloats(92/255, 92/255, 92/255);
    }

    public makeSatellites(planet: Planet, n: number): void {
        if(n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        for (let i = 0; i < n; i++) {
            this.makeSatellite(planet);
        }
    }

    public translateAllBodies(deplacement: Vector3): void {
        for (const planet of this.bodies) {
            planet.setAbsolutePosition(planet.getAbsolutePosition().add(deplacement));
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
            else if (body.physicalProperties.mass / Vector3.DistanceSquared(body.getAbsolutePosition(), point) > nearest.physicalProperties.mass / Vector3.DistanceSquared(nearest.getAbsolutePosition(), point)) {
                nearest = body;
            }
        }
        if (nearest == null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    public getTime() {
        return this.clock;
    }

    public update(deltaTime: number): void {
        this.clock += deltaTime;

        this.scene._chunkForge.update();
        for (const body of this.getBodies()) body.update(this.scene.getController(), deltaTime);

        this.translateAllBodies(this.scene.getController().transform.getAbsolutePosition().negate());
        this.scene.getController().transform.translate(this.scene.getController().transform.getAbsolutePosition().negate());
    }
}
