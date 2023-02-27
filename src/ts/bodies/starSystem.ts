import { Vector3 } from "@babylonjs/core";

import { AbstractBody, isOrbiting } from "./abstractBody";
import { Star } from "./stars/star";
import { UberScene } from "../uberCore/uberScene";
import { Planemo } from "./planets/planemo";
import { normalRandom, uniformRandBool } from "extended-random";
import { TelluricPlanet } from "./planets/telluricPlanet";
import { GasPlanet } from "./planets/gasPlanet";
import { clamp } from "terrain-generation";
import { getOrbitalPeriod } from "../orbits/kepler";
import { BlackHole } from "./stars/blackHole";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { StarSystemDescriptor } from "../descriptors/starSystemDescriptor";

enum Steps {
    CHOOSE_PLANET_TYPE = 300
}

export class StarSystem {
    private readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    private readonly bodies: AbstractBody[] = [];

    readonly stars: (Star | BlackHole)[] = [];

    readonly planemos: Planemo[] = [];

    readonly planets: Planemo[] = [];

    readonly telluricPlanets: TelluricPlanet[] = [];
    readonly gasPlanets: GasPlanet[] = [];
    readonly satellites: TelluricPlanet[] = [];

    readonly descriptor: StarSystemDescriptor;

    constructor(seed: number, scene: UberScene) {
        this.scene = scene;
        this.postProcessManager = new PostProcessManager(this.scene);

        this.descriptor = new StarSystemDescriptor(seed);
    }

    /**
     * Adds a telluric planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addTelluricPlanet(planet: TelluricPlanet): TelluricPlanet {
        this.bodies.push(planet);
        this.planemos.push(planet);
        this.planets.push(planet);
        this.telluricPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a gas planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addGasPlanet(planet: GasPlanet): GasPlanet {
        this.bodies.push(planet);
        this.planemos.push(planet);
        this.planets.push(planet);
        this.gasPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a satellite to the system and returns it
     * @param satellite The satellite to add to the system
     */
    public addTelluricSatellite(satellite: TelluricPlanet): TelluricPlanet {
        this.bodies.push(satellite);
        this.planemos.push(satellite);
        this.satellites.push(satellite);
        return satellite;
    }

    /**
     * Adds a star or a blackhole to the system and returns it
     * @param star The star added to the system
     */
    public addStar(star: Star | BlackHole): Star | BlackHole {
        this.bodies.push(star);
        this.stars.push(star);
        return star;
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeStar(seed = this.descriptor.getStarSeed(this.stars.length)): Star {
        if(this.stars.length >= this.descriptor.getNbStars()) console.warn(`You are adding a star 
        to a system that already has ${this.stars.length} stars.
        The capacity of the generator was supposed to be ${this.descriptor.getNbStars()} This is not a problem, but it may be.`)
        const star = new Star(`star${this.stars.length}`, this.scene, seed, []);
        //TODO: make this better, make it part of the generation
        star.descriptor.orbitalProperties.periapsis = star.getRadius() * 4;
        star.descriptor.orbitalProperties.apoapsis = star.getRadius() * 4;

        this.addStar(star);
        return star;
    }

    /**
     * Makes a black hole and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeBlackHole(seed = this.descriptor.getStarSeed(this.stars.length)): BlackHole {
        if(this.stars.length >= this.descriptor.getNbStars()) console.warn(`You are adding a black hole
        to a system that already has ${this.stars.length} stars.
        The capacity of the generator was supposed to be ${this.descriptor.getNbStars()} This is not a problem, but it may be.`);
        const blackHole = new BlackHole(`blackHole${this.stars.length}`, 1000e3, seed, this.stars);
        this.addStar(blackHole);
        return blackHole;
    }

    /**
     * Makes n stars and adds them to the system. By default, it will use the next available seeds planned by the system descriptor
     * @param n The number of stars to make (by default, the number of stars planned by the system descriptor)
     */
    public makeStars(n= this.descriptor.getNbStars()): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) this.makeStar();
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeTelluricPlanet(seed = this.descriptor.getPlanetSeed(this.planets.length)): TelluricPlanet {
        if (this.planets.length >= this.descriptor.getNbPlanets()) console.warn(`You are adding a telluric planet to the system.
            The system generator had planned for ${this.descriptor.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);
        const planet = new TelluricPlanet(`telluricPlanet${this.planets.length}`, this.scene, seed, this.stars);
        this.addTelluricPlanet(planet);
        return planet;
    }

    /**
     * Makes a gas planet and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeGasPlanet(seed = this.descriptor.getPlanetSeed(this.planets.length)): GasPlanet {
        if (this.planets.length >= this.descriptor.getNbPlanets()) console.warn(`You are adding a gas planet to the system.
            The system generator had planned for ${this.descriptor.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);
        const planet = new GasPlanet(`gasPlanet${this.planets.length}`, this.scene, seed, this.stars);
        this.addGasPlanet(planet);
        return planet;
    }

    public makePlanets(n: number): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of planets : ${n}`);
        for (let i = 0; i < n; i++) {
            if (uniformRandBool(0.5, this.descriptor.rng, Steps.CHOOSE_PLANET_TYPE + this.planemos.length)) {
                const planet = this.makeTelluricPlanet();
                this.makeSatellites(planet, planet.descriptor.nbMoons);
            } else {
                const planet = this.makeGasPlanet();
                this.makeSatellites(planet, planet.descriptor.nbMoons);
            }
        }
    }

    public makeSatellite(planet: TelluricPlanet | GasPlanet, seed = planet.descriptor.getMoonSeed(planet.descriptor.childrenBodies.length)): TelluricPlanet {
        const satellite = new TelluricPlanet(`${planet.name}Sattelite${planet.descriptor.childrenBodies.length}`, this.scene, seed, [planet]);
        const periapsis = 2 * planet.getRadius() + clamp(normalRandom(3, 1, satellite.descriptor.rng, 90), 0, 20) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.descriptor.rng, 92), 1, 1.5);
        satellite.descriptor.physicalProperties.mass = 1;

        satellite.descriptor.orbitalProperties.periapsis = periapsis;
        satellite.descriptor.orbitalProperties.apoapsis = apoapsis;
        satellite.descriptor.orbitalProperties.period = getOrbitalPeriod(
            periapsis,
            apoapsis,
            satellite.parentBodies.map((p) => p.descriptor)
        );
        satellite.descriptor.orbitalProperties.orientationQuaternion = satellite.transform.getRotationQuaternion();

        satellite.material.colorSettings.desertColor.copyFromFloats(92 / 255, 92 / 255, 92 / 255);
        satellite.material.updateConstants();

        planet.descriptor.childrenBodies.push(satellite.descriptor);

        this.addTelluricSatellite(satellite);
        return satellite;
    }

    /**
     * Makes n more satellites for the given planet. By default, it will make as many as the planet has in the generation.
     * You can make more, but it will generate warnings and might cause issues.
     * @param planet The planet to make satellites for
     * @param n The number of satellites to make
     */
    public makeSatellites(planet: TelluricPlanet | GasPlanet, n = planet.descriptor.nbMoons): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        if (planet.descriptor.childrenBodies.length + n > planet.descriptor.nbMoons) console.warn(
            `You are making more satellites than the planet had planned in its the generation: 
            You want ${n} more which will amount to a total ${planet.descriptor.childrenBodies.length + n}. 
            The generator had planned ${planet.descriptor.nbMoons}.
            This might cause issues, or not who knows. 
            You can just leave this argument empty to make as many as the planet had planned.`);

        for (let i = 0; i < n; i++) this.makeSatellite(planet, planet.descriptor.getMoonSeed(planet.descriptor.childrenBodies.length));
    }

    /**
     * Translates all bodies in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateAllBodies(displacement: Vector3): void {
        for (const planet of this.bodies) planet.transform.translate(displacement);
    }

    /**
     * Returns the list of all celestial bodies managed by the star system
     */
    public getBodies(): AbstractBody[] {
        return this.bodies;
    }

    /**
     * Returns the list of all planets managed by the star system
     */
    public getPlanets(): Planemo[] {
        return this.planemos;
    }

    /**
     * Returns the nearest body to the origin
     */
    public getNearestBody(position: Vector3 = Vector3.Zero()): AbstractBody {
        if (this.getBodies().length == 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        let smallerDistance2 = -1;
        for (const body of this.getBodies()) {
            const distance2 = body.transform.getAbsolutePosition().subtract(position).lengthSquared();
            if (nearest == null || distance2 < smallerDistance2) {
                nearest = body;
                smallerDistance2 = distance2;
            }
        }
        if (nearest == null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    /**
     * Inits the post processes and moves the system forward in time to the current time (it is additive)
     */
    public init() {
        this.initPostProcesses();
        this.update(Date.now() / 1000);
    }

    /**
     * Inits the post processes of all the bodies in the system
     * @private
     */
    private initPostProcesses() {
        this.postProcessManager.addStarField(this.stars, this.bodies);
        for (const body of this.bodies) this.postProcessManager.addBody(body, this.stars);
        this.postProcessManager.setBody(this.getNearestBody(this.scene.getActiveUberCamera().position));
    }

    /**
     * Updates the system and all its bodies forward in time by the given delta time
     * @param deltaTime The time elapsed since the last update
     */
    public update(deltaTime: number): void {
        for (const body of this.getBodies()) body.updateTransform(this.scene.getActiveController(), deltaTime);

        for (const planet of this.planemos) planet.updateMaterial(this.scene.getActiveController(), this.stars);

        const displacement = this.scene.getActiveController().transform.getAbsolutePosition().negate();
        this.translateAllBodies(displacement);
        this.scene.getActiveController().transform.translate(displacement);

        const nearest = this.getNearestBody(this.scene.getActiveUberCamera().position);
        this.postProcessManager.setBody(nearest);
        const switchLimit = nearest.postProcesses.rings ? this.postProcessManager.getRings(nearest).settings.ringStart : 2;
        if (isOrbiting(this.scene.getActiveController(), nearest, switchLimit)) this.postProcessManager.setSurfaceOrder();
        else this.postProcessManager.setSpaceOrder();
        this.postProcessManager.update(deltaTime);
    }

    /**
     * Generates the system using the seed provided in the constructor
     */
    public generate() {
        this.makeStars(this.descriptor.getNbStars());
        this.makePlanets(this.descriptor.getNbPlanets());
    }
}
