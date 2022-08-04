import { Vector3 } from "@babylonjs/core";

import { AbstractBody } from "./abstractBody";
import { Star } from "./stars/star";
import { UberScene } from "../core/uberScene";
import { Planet } from "./planets/planet";
import { alea } from "seedrandom";
import { centeredRand, normalRandom, randRangeInt, uniformRandBool } from "extended-random";
import { TelluricPlanet } from "./planets/telluricPlanet";
import { GasPlanet } from "./planets/gasPlanet";
import { clamp } from "../utils/gradientMath";
import { getOrbitalPeriod } from "../orbits/kepler";

export class StarSystem {
    readonly scene: UberScene;
    private readonly bodies: AbstractBody[] = [];

    readonly stars: Star[] = [];

    readonly planets: Planet[] = [];

    private clock = 0;

    readonly rng: () => number;

    constructor(seed: number, scene: UberScene) {
        this.scene = scene;
        this.rng = alea(seed.toString());
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
            const star = new Star(`star${i}`, this, this.rng(), this.stars);
            //TODO: make this better, make it part of the generation
            star.orbitalProperties.periapsis = star.getRadius() * 4;
            star.orbitalProperties.apoapsis = star.getRadius() * 4;
        }
    }

    public makeTelluricPlanet(): void {
        const planet = new TelluricPlanet(`telluricPlanet`, this, this.rng(), this.stars);
        planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;
        //TODO: use formula
        planet.physicalProperties.minTemperature = randRangeInt(-50, 5, planet.rng);
        planet.physicalProperties.maxTemperature = randRangeInt(10, 50, planet.rng);

        planet.material.colorSettings.plainColor.copyFromFloats(
            0.22 + centeredRand(planet.rng) / 10,
            0.37 + centeredRand(planet.rng) / 10,
            0.024 + centeredRand(planet.rng) / 10
        );
        planet.material.colorSettings.beachSize = 250 + 100 * centeredRand(planet.rng);
        planet.material.updateManual();
        this.makeSatellites(planet, randRangeInt(1, 3, planet.rng));
    }

    public makeGasPlanet(): void {
        const planet = new GasPlanet(`gasPlanet`, this, this.rng(), this.stars);
        planet.physicalProperties.rotationPeriod = (24 * 60 * 60) / 10;
        this.makeSatellites(planet, randRangeInt(0, 7, planet.rng));
    }

    public makePlanets(n: number): void {
        if(n < 0) throw new Error(`Cannot make a negative amount of planets : ${n}`);
        for (let i = 0; i < n; i++) {
            if(uniformRandBool(0.5, this.rng)) {
                this.makeTelluricPlanet()
            } else {
                this.makeGasPlanet()
            }
        }
    }

    public makeSatellite(planet: Planet): void {
        const satellite = new TelluricPlanet(`${planet.name}Sattelite`, this, planet.rng(), [planet]);
        const periapsis = 5 * planet.getRadius() + clamp(normalRandom(10, 1, satellite.rng), -2, 20) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.rng), 1, 1.5);
        satellite.physicalProperties.mass = 1;
        satellite.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, satellite.parentBodies),
            orientationQuaternion: satellite.getRotationQuaternion()
        };
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
        return nearest!;
    }

    /**
     * Returns the most influential body at a given point
     */
    public getMostInfluentialBodyAtPoint(point: Vector3): AbstractBody {
        //FIXME: use point
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        for (const body of this.bodies) {
            if (nearest == null) nearest = body;
            else if (body.physicalProperties.mass / body.getAbsolutePosition().lengthSquared() > nearest.physicalProperties.mass / nearest.getAbsolutePosition().lengthSquared()) {
                nearest = body;
            }
        }
        return nearest!;
    }

    public getTime() {
        return this.clock;
    }

    public update(deltaTime: number): void {
        this.clock += deltaTime;

        this.scene._chunkForge.update(this.scene.depthRenderer);
        for (const body of this.getBodies()) body.update(this.scene.getPlayer(), deltaTime);

        this.translateAllBodies(this.scene.getPlayer().getAbsolutePosition().negate());
        this.scene.getPlayer().translate(this.scene.getPlayer().getAbsolutePosition().negate());
    }
}
