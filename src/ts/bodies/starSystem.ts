import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { AbstractBody } from "./abstractBody";
import { Star } from "./stellarObjects/star";
import { UberScene } from "../uberCore/uberScene";
import { Planemo } from "./planemos/planemo";
import { normalRandom } from "extended-random";
import { TelluricPlanemo } from "./planemos/telluricPlanemo";
import { GasPlanet } from "./planemos/gasPlanet";
import { clamp } from "terrain-generation";
import { getOrbitalPeriod } from "../orbits/kepler";
import { BlackHole } from "./stellarObjects/blackHole";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { StarSystemDescriptor } from "../descriptors/starSystemDescriptor";
import { isOrbiting } from "../utils/nearestBody";
import { BODY_TYPE } from "../descriptors/common";
import { StellarObject } from "./stellarObjects/stellarObject";
import { SpaceStation } from "../spacestation/spaceStation";
import { AbstractObject } from "./abstractObject";
import { PostProcessType } from "../postProcesses/postProcessTypes";

export class StarSystem {
    private readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    private readonly orbitalObjects: AbstractObject[] = [];

    private readonly spaceStations: SpaceStation[] = [];

    private readonly celestialBodies: AbstractBody[] = [];

    /**
     * The list of all stellar objects in the system (stars, black holes, pulsars)
     */
    readonly stellarObjects: StellarObject[] = [];

    /**
     * The list of all planemos in the system (planets and satellites)
     */
    readonly planemos: Planemo[] = [];

    /**
     * The list of all planets in the system (telluric and gas)
     */
    readonly planets: Planemo[] = [];

    /**
     * The list of all telluric planets in the system
     */
    readonly telluricPlanets: TelluricPlanemo[] = [];

    /**
     * The list of all gas planets in the system
     */
    readonly gasPlanets: GasPlanet[] = [];

    /**
     * The list of all satellites in the system
     */
    readonly satellites: TelluricPlanemo[] = [];

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
    public addTelluricPlanet(planet: TelluricPlanemo): TelluricPlanemo {
        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
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
        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
        this.planemos.push(planet);
        this.planets.push(planet);
        this.gasPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a satellite to the system and returns it
     * @param satellite The satellite to add to the system
     */
    public addTelluricSatellite(satellite: TelluricPlanemo): TelluricPlanemo {
        this.orbitalObjects.push(satellite);
        this.celestialBodies.push(satellite);
        this.planemos.push(satellite);
        this.satellites.push(satellite);
        return satellite;
    }

    /**
     * Adds a star or a blackhole to the system and returns it
     * @param stellarObject The star added to the system
     */
    public addStellarObject(stellarObject: StellarObject): StellarObject {
        this.orbitalObjects.push(stellarObject);
        this.celestialBodies.push(stellarObject);
        this.stellarObjects.push(stellarObject);
        return stellarObject;
    }

    public addSpaceStation(spaceStation: SpaceStation): SpaceStation {
        this.orbitalObjects.push(spaceStation);
        this.spaceStations.push(spaceStation);
        return spaceStation;
    }

    /**
     * Makes a star and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the star generation (by default, the next available seed planned by the system descriptor)
     */
    public makeStellarObject(seed = this.descriptor.getStarSeed(this.stellarObjects.length)): StellarObject {
        if (this.stellarObjects.length >= this.descriptor.getNbStars())
            console.warn(`You are adding a star 
        to a system that already has ${this.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${this.descriptor.getNbStars()} This is not a problem, but it may be.`);

        const isStellarObjectBlackHole = this.descriptor.getBodyTypeOfStar(this.stellarObjects.length) === BODY_TYPE.BLACK_HOLE;

        const star = isStellarObjectBlackHole
            ? new BlackHole(`blackHole${this.stellarObjects.length}`, seed, [], this.scene)
            : new Star(`star${this.stellarObjects.length}`, this.scene, seed, []);

        //TODO: make this better, make it part of the generation
        star.descriptor.orbitalProperties.periapsis = star.getRadius() * 4;
        star.descriptor.orbitalProperties.apoapsis = star.getRadius() * 4;

        this.addStellarObject(star);
        return star;
    }

    /**
     * Makes a black hole and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeBlackHole(seed = this.descriptor.getStarSeed(this.stellarObjects.length)): BlackHole {
        if (this.stellarObjects.length >= this.descriptor.getNbStars())
            console.warn(`You are adding a black hole
        to a system that already has ${this.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${this.descriptor.getNbStars()} This is not a problem, but it may be.`);
        const blackHole = new BlackHole(`blackHole${this.stellarObjects.length}`, seed, this.stellarObjects, this.scene);

        this.addStellarObject(blackHole);
        return blackHole;
    }

    /**
     * Makes n stars and adds them to the system. By default, it will use the next available seeds planned by the system descriptor
     * @param n The number of stars to make (by default, the number of stars planned by the system descriptor)
     */
    public makeStellarObjects(n = this.descriptor.getNbStars()): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) this.makeStellarObject();
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeTelluricPlanet(seed = this.descriptor.getPlanetSeed(this.planets.length)): TelluricPlanemo {
        if (this.planets.length >= this.descriptor.getNbPlanets())
            console.warn(`You are adding a telluric planet to the system.
            The system generator had planned for ${this.descriptor.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);
        const planet = new TelluricPlanemo(`telluricPlanet${this.planets.length}`, this.scene, seed, this.stellarObjects);
        this.addTelluricPlanet(planet);
        return planet;
    }

    /**
     * Makes a gas planet and adds it to the system. By default, it will use the next available seed planned by the system descriptor
     * @param seed The seed to use for the planet generation (by default, the next available seed planned by the system descriptor)
     */
    public makeGasPlanet(seed = this.descriptor.getPlanetSeed(this.planets.length)): GasPlanet {
        if (this.planets.length >= this.descriptor.getNbPlanets())
            console.warn(`You are adding a gas planet to the system.
            The system generator had planned for ${this.descriptor.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);
        const planet = new GasPlanet(`gasPlanet${this.planets.length}`, this.scene, seed, this.stellarObjects);
        this.addGasPlanet(planet);
        return planet;
    }

    public makePlanets(n: number): void {
        console.assert(n >= 0, `Cannot make a negative amount of planets : ${n}`);
        for (let i = 0; i < n; i++) {
            switch (this.descriptor.getBodyTypeOfPlanet(this.planets.length)) {
                case BODY_TYPE.TELLURIC:
                    this.makeSatellites(this.makeTelluricPlanet());
                    break;
                case BODY_TYPE.GAS:
                    this.makeSatellites(this.makeGasPlanet());
                    break;
                default:
                    throw new Error(`Unknown body type ${this.descriptor.getBodyTypeOfPlanet(this.planets.length)}`);
            }
        }
    }

    public makeSatellite(planet: TelluricPlanemo | GasPlanet, seed = planet.descriptor.getMoonSeed(planet.descriptor.childrenBodies.length)): TelluricPlanemo {
        const satellite = new TelluricPlanemo(`${planet.name}Sattelite${planet.descriptor.childrenBodies.length}`, this.scene, seed, [planet]);
        const periapsis = 2 * planet.getRadius() + clamp(normalRandom(3, 1, satellite.descriptor.rng, 90), 0, 20) * planet.getRadius() * 2;
        const apoapsis = periapsis * clamp(normalRandom(1, 0.05, satellite.descriptor.rng, 92), 1, 1.5);
        satellite.descriptor.physicalProperties.mass = 1;

        satellite.descriptor.orbitalProperties.periapsis = periapsis;
        satellite.descriptor.orbitalProperties.apoapsis = apoapsis;
        satellite.descriptor.orbitalProperties.period = getOrbitalPeriod(
            periapsis,
            apoapsis,
            satellite.parentObjects.map((p) => p.descriptor)
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
    public makeSatellites(planet: TelluricPlanemo | GasPlanet, n = planet.descriptor.nbMoons): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        if (planet.descriptor.childrenBodies.length + n > planet.descriptor.nbMoons)
            console.warn(
                `You are making more satellites than the planet had planned in its the generation: 
            You want ${n} more which will amount to a total ${planet.descriptor.childrenBodies.length + n}. 
            The generator had planned ${planet.descriptor.nbMoons}.
            This might cause issues, or not who knows. 
            You can just leave this argument empty to make as many as the planet had planned.`
            );

        for (let i = 0; i < n; i++) this.makeSatellite(planet, planet.descriptor.getMoonSeed(planet.descriptor.childrenBodies.length));
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateEverythingNow(displacement: Vector3): void {
        for (const object of this.orbitalObjects) object.transform.translate(displacement);
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public registerTranslateAllBodies(displacement: Vector3): void {
        for (const object of this.orbitalObjects) object.nextState.position.addInPlace(displacement);
    }

    /**
     * Returns the list of all celestial bodies managed by the star system
     */
    public getBodies(): AbstractBody[] {
        return this.celestialBodies;
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
    public getNearestBody(position = Vector3.Zero()): AbstractBody {
        if (this.celestialBodies.length === 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        let smallerDistance2 = -1;
        for (const body of this.celestialBodies) {
            const distance2 = body.transform.getAbsolutePosition().subtract(position).lengthSquared();
            if (nearest === null || distance2 < smallerDistance2) {
                nearest = body;
                smallerDistance2 = distance2;
            }
        }
        if (nearest === null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    public getNearestObject(position = Vector3.Zero()): AbstractObject {
        if (this.orbitalObjects.length === 0) throw new Error("There are no objects in the solar system");
        let nearest = null;
        let smallerDistance2 = -1;
        for (const object of this.orbitalObjects) {
            const distance2 = object.transform.getAbsolutePosition().subtract(position).lengthSquared();
            if (nearest === null || distance2 < smallerDistance2) {
                nearest = object;
                smallerDistance2 = distance2;
            }
        }
        if (nearest === null) throw new Error("There are no objects in the solar system");
        return nearest;
    }

    /**
     * Inits the post processes and moves the system forward in time to the current time (it is additive)
     */
    public init(nbWarmUpUpdates = 100): void {
        this.initPostProcesses();
        this.update(Date.now() / 1000);
        for (let i = 0; i < nbWarmUpUpdates; i++) this.update(1);
    }

    /**
     * Inits the post processes of all the bodies in the system
     * @private
     */
    private initPostProcesses() {
        this.postProcessManager.addStarField(this.stellarObjects, this.celestialBodies);
        for (const object of this.orbitalObjects) this.postProcessManager.addObject(object, this.stellarObjects);
        this.postProcessManager.setBody(this.getNearestBody(this.scene.getActiveUberCamera().position));
    }

    /**
     * Updates the system and all its bodies forward in time by the given delta time
     * @param deltaTime The time elapsed since the last update
     */
    public update(deltaTime: number): void {
        const controller = this.scene.getActiveController();

        for (const object of this.orbitalObjects) {
            object.updateInternalClock(deltaTime);

            const initialPosition = object.transform.getAbsolutePosition().clone();
            const newPosition = object.computeNextOrbitalPosition().clone();

            // if the controller is close to the body, it will follow its movement
            const orbitLimit = object instanceof SpaceStation ? 200 : 10;
            if (isOrbiting(controller, object, orbitLimit) && this.getNearestObject() === object) controller.transform.translate(newPosition.subtract(initialPosition));

            // then we keep the controller at the origin
            const displacementTranslation = controller.transform.getAbsolutePosition().negate();
            this.registerTranslateAllBodies(displacementTranslation);
            controller.transform.translate(displacementTranslation);

            const dtheta = object.updateRotation(deltaTime);

            // if the controller is close to the object and it is a body, it will follow its rotation
            if (isOrbiting(controller, object) && this.getNearestBody() === object) controller.transform.rotateAround(object.nextState.position, object.getRotationAxis(), dtheta);

            // then we keep the controller at the origin
            const displacementRotation = controller.transform.getAbsolutePosition().negate();
            this.registerTranslateAllBodies(displacementRotation);
            controller.transform.translate(displacementRotation);
        }

        for (const object of this.orbitalObjects) object.applyNextState();

        for (const body of this.telluricPlanets.concat(this.satellites)) body.updateLOD(controller.transform.getAbsolutePosition());

        for (const object of this.orbitalObjects) object.computeCulling(controller.getActiveCamera().getAbsolutePosition());

        for (const planet of this.planemos) planet.updateMaterial(controller, this.stellarObjects, deltaTime);

        for (const stellarObject of this.stellarObjects) {
            if (stellarObject instanceof Star) stellarObject.updateMaterial();
        }

        const nearestBody = this.getNearestBody(this.scene.getActiveUberCamera().position);
        this.postProcessManager.setBody(nearestBody);
        const switchLimit = nearestBody.postProcesses.includes(PostProcessType.RING) ? this.postProcessManager.getRings(nearestBody).settings.ringStart : 2;
        if (isOrbiting(controller, nearestBody, switchLimit)) this.postProcessManager.setSurfaceOrder();
        else this.postProcessManager.setSpaceOrder();
        this.postProcessManager.update(deltaTime);
    }

    /**
     * Generates the system using the seed provided in the constructor
     */
    public generate() {
        this.makeStellarObjects(this.descriptor.getNbStars());
        this.makePlanets(this.descriptor.getNbPlanets());
    }

    public dispose() {
        this.postProcessManager.dispose();
        for (const spacestation of this.spaceStations) spacestation.dispose();
        for (const body of this.celestialBodies) body.dispose();
    }
}
