import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { AbstractBody } from "../view/bodies/abstractBody";
import { Star } from "../view/bodies/stellarObjects/star";
import { UberScene } from "./uberCore/uberScene";
import { Planemo, PlanemoMaterial } from "../view/bodies/planemos/planemo";
import { TelluricPlanemo } from "../view/bodies/planemos/telluricPlanemo";
import { GasPlanet } from "../view/bodies/planemos/gasPlanet";
import { BlackHole } from "../view/bodies/stellarObjects/blackHole";
import { PostProcessManager } from "./postProcessManager";
import { StarSystemModel } from "../model/starSystemModel";
import { isOrbiting } from "../utils/nearestBody";
import { NeutronStar } from "../view/bodies/stellarObjects/neutronStar";
import { BODY_TYPE } from "../model/common";
import { StellarObject } from "../view/bodies/stellarObjects/stellarObject";
import { SpaceStation } from "../view/spaceStation";
import { AbstractObject } from "../view/bodies/abstractObject";
import { romanNumeral } from "../utils/nameGenerator";
import { TelluricPlanemoModel } from "../model/planemos/telluricPlanemoModel";
import { GasPlanetModel } from "../model/planemos/gasPlanetModel";
import { BlackHoleModel } from "../model/stellarObjects/blackHoleModel";
import { StarModel } from "../model/stellarObjects/starModel";
import { rotateAround, setUpVector, translate } from "./uberCore/transforms/basicTransform";
import { MandelbulbModel } from "../model/planemos/mandelbulbModel";
import { Mandelbulb } from "../view/bodies/planemos/mandelbulb";
import { getMoonSeed } from "../model/planemos/common";
import { NeutronStarModel } from "../model/stellarObjects/neutronStarModel";
import { ShipController } from "../spaceship/shipController";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../view/postProcesses/postProcessTypes";
import { starName } from "../utils/parseToStrings";

export class StarSystem {
    private readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    private readonly starfieldRotation: Quaternion = Quaternion.Identity();

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
    readonly planemosWithMaterial: PlanemoMaterial[] = [];

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
     * The list of all mandelbulbs in the system
     */
    readonly mandelbulbs: Mandelbulb[] = [];

    /**
     * The list of all satellites in the system
     */
    readonly satellites: TelluricPlanemo[] = [];

    readonly model: StarSystemModel;

    constructor(model: StarSystemModel | number, scene: UberScene) {
        this.scene = scene;
        this.postProcessManager = new PostProcessManager(this.scene);

        this.model = model instanceof StarSystemModel ? model : new StarSystemModel(model);
    }

    /**
     * Adds a telluric planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addTelluricPlanet(planet: TelluricPlanemo): TelluricPlanemo {
        if (this.planets.length >= this.model.getNbPlanets())
            console.warn(`You are adding a telluric planet to the system.
            The system generator had planned for ${this.model.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);

        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
        this.planemos.push(planet);
        this.planemosWithMaterial.push(planet);
        this.planets.push(planet);
        this.telluricPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a gas planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addGasPlanet(planet: GasPlanet): GasPlanet {
        if (this.planets.length >= this.model.getNbPlanets())
            console.warn(`You are adding a gas planet to the system.
            The system generator had planned for ${this.model.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);

        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
        this.planemos.push(planet);
        this.planemosWithMaterial.push(planet);
        this.planets.push(planet);
        this.gasPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a satellite to the system and returns it
     * @param satellite The satellite to add to the system
     */
    public addTelluricSatellite(satellite: TelluricPlanemo): TelluricPlanemo {
        if (this.planets.length >= this.model.getNbPlanets())
            console.warn(`You are adding a telluric planet to the system.
            The system generator had planned for ${this.model.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);

        this.orbitalObjects.push(satellite);
        this.celestialBodies.push(satellite);
        this.planemos.push(satellite);
        this.planemosWithMaterial.push(satellite);
        this.satellites.push(satellite);
        return satellite;
    }

    public addMandelbulb(mandelbulb: Mandelbulb): Mandelbulb {
        if (this.planets.length >= this.model.getNbPlanets())
            console.warn(`You are adding a mandelbulb to the system.
            The system generator had planned for ${this.model.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);

        this.orbitalObjects.push(mandelbulb);
        this.celestialBodies.push(mandelbulb);
        this.planemos.push(mandelbulb);
        this.mandelbulbs.push(mandelbulb);
        return mandelbulb;
    }

    /**
     * Adds a star or a blackhole to the system and returns it
     * @param stellarObject The star added to the system
     */
    public addStellarObject(stellarObject: StellarObject): StellarObject {
        if (this.stellarObjects.length >= this.model.getNbStars())
            console.warn(`You are adding a star 
        to a system that already has ${this.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${this.model.getNbStars()} This is not a problem, but it may be.`);

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
     * Makes a star and adds it to the system. By default, it will use the next available seed planned by the system model
     * @param seed The seed to use for the star generation (by default, the next available seed planned by the system model)
     */
    public makeStellarObject(seed: number = this.model.getStarSeed(this.stellarObjects.length)): StellarObject {
        const isStellarObjectBlackHole = this.model.getBodyTypeOfStar(this.stellarObjects.length) === BODY_TYPE.BLACK_HOLE;
        if (isStellarObjectBlackHole) return this.makeBlackHole(seed);
        else return this.makeStar(seed);
    }

    public makeStar(model: number | StarModel = this.model.getStarSeed(this.stellarObjects.length)): Star {
        const name = starName(this.model.getName(), this.stellarObjects.length);
        const star = new Star(name, this.scene, model, this.stellarObjects[0]);
        this.addStellarObject(star);
        return star;
    }

    public makeMandelbulb(model: number | MandelbulbModel = this.model.getPlanetSeed(this.mandelbulbs.length)): Mandelbulb {
        if (this.planets.length >= this.model.getNbPlanets())
            console.warn(`You are adding a mandelbulb to the system.
            The system generator had planned for ${this.model.getNbPlanets()} planets, but you are adding the ${this.planets.length + 1}th planet.
            This might cause issues, or not who knows.`);
        const mandelbulb = new Mandelbulb(`${this.model.getName()} ${romanNumeral(this.planets.length + 1)}`, this.scene, model, this.stellarObjects[0]);
        this.addMandelbulb(mandelbulb);
        return mandelbulb;
    }

    /**
     * Makes a black hole and adds it to the system. By default, it will use the next available model planned by the system
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public makeBlackHole(model: number | BlackHoleModel = this.model.getStarSeed(this.stellarObjects.length)): BlackHole {
        const blackHole = new BlackHole(`${this.model.getName()} ${this.stellarObjects.length + 1}`, this.scene, model, this.stellarObjects[0]);
        this.addStellarObject(blackHole);
        return blackHole;
    }

    public makeNeutronStar(model: number | NeutronStarModel = this.model.getStarSeed(this.stellarObjects.length)): NeutronStar {
        if (this.stellarObjects.length >= this.model.getNbStars())
            console.warn(`You are adding a neutron star
        to a system that already has ${this.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${this.model.getNbStars()} This is not a problem, but it may be.`);
        const neutronStar = new NeutronStar(`neutronStar${this.stellarObjects.length}`, this.scene, model, this.stellarObjects[0]);

        this.addStellarObject(neutronStar);
        return neutronStar;
    }

    /**
     * Makes n stars and adds them to the system. By default, it will use the next available seeds planned by the system model
     * @param n The number of stars to make (by default, the number of stars planned by the system model)
     */
    public makeStellarObjects(n = this.model.getNbStars()): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) this.makeStellarObject();
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public makeTelluricPlanet(model: number | TelluricPlanemoModel = this.model.getPlanetSeed(this.planets.length)): TelluricPlanemo {
        const planet = new TelluricPlanemo(`${this.model.getName()} ${romanNumeral(this.planets.length + 1)}`, this.scene, model, this.stellarObjects[0]);
        this.addTelluricPlanet(planet);
        return planet;
    }

    /**
     * Makes a gas planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public makeGasPlanet(model: number | GasPlanetModel = this.model.getPlanetSeed(this.planets.length)): GasPlanet {
        const planet = new GasPlanet(`${this.model.getName()} ${romanNumeral(this.planets.length + 1)}`, this.scene, model, this.stellarObjects[0]);
        this.addGasPlanet(planet);
        return planet;
    }

    public makePlanets(n: number): void {
        console.assert(n >= 0, `Cannot make a negative amount of planets : ${n}`);

        for (let i = 0; i < n; i++) {
            switch (this.model.getBodyTypeOfPlanet(this.planets.length)) {
                case BODY_TYPE.TELLURIC:
                    this.makeSatellites(this.makeTelluricPlanet());
                    break;
                case BODY_TYPE.GAS:
                    this.makeSatellites(this.makeGasPlanet());
                    break;
                case BODY_TYPE.MANDELBULB:
                    this.makeSatellites(this.makeMandelbulb());
                    break;
                default:
                    throw new Error(`Unknown body type ${this.model.getBodyTypeOfPlanet(this.planets.length)}`);
            }
        }
    }

    public makeSatellite(planet: Planemo, model: TelluricPlanemoModel | number = getMoonSeed(planet.model, planet.model.childrenBodies.length)): TelluricPlanemo {
        const satellite = new TelluricPlanemo(`${planet.name} ${romanNumeral(planet.model.childrenBodies.length + 1)}`, this.scene, model, planet);

        satellite.material.colorSettings.desertColor.copyFromFloats(92 / 255, 92 / 255, 92 / 255);
        satellite.material.updateConstants();

        planet.model.childrenBodies.push(satellite.model);

        this.addTelluricSatellite(satellite);
        return satellite;
    }

    /**
     * Makes n more satellites for the given planet. By default, it will make as many as the planet has in the generation.
     * You can make more, but it will generate warnings and might cause issues.
     * @param planet The planet to make satellites for
     * @param n The number of satellites to make
     */
    public makeSatellites(planet: Planemo, n = planet.model.nbMoons): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        if (planet.model.childrenBodies.length + n > planet.model.nbMoons)
            console.warn(
                `You are making more satellites than the planet had planned in its the generation: 
            You want ${n} more which will amount to a total ${planet.model.childrenBodies.length + n}. 
            The generator had planned ${planet.model.nbMoons}.
            This might cause issues, or not who knows. 
            You can just leave this argument empty to make as many as the planet had planned.`
            );

        for (let i = 0; i < n; i++) this.makeSatellite(planet, getMoonSeed(planet.model, planet.model.childrenBodies.length));
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateEverythingNow(displacement: Vector3): void {
        for (const object of this.orbitalObjects) translate(object.getTransform(), displacement);
    }

    /**
     * Returns the list of all celestial bodies managed by the star system
     */
    public getBodies(): AbstractBody[] {
        return this.celestialBodies;
    }

    /**
     * Returns the nearest body to the origin
     */
    public getNearestBody(position = Vector3.Zero()): AbstractBody {
        if (this.celestialBodies.length === 0) throw new Error("There are no bodies in the solar system");
        let nearest = null;
        let smallerDistance = -1;
        for (const body of this.celestialBodies) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.model.radius;
            if (nearest === null || distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
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
            const distance2 = object.getTransform().getAbsolutePosition().subtract(position).lengthSquared();
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

        for (const object of this.orbitalObjects) {
            const displacement = new Vector3(object.model.orbit.radius, 0, 0);
            const targetNormal = object.model.orbit.normalToPlane;
            const rotationAxis = Vector3.Cross(Vector3.Up(), targetNormal);
            const angle = Math.acos(Vector3.Dot(Vector3.Up(), targetNormal));
            const quaternion = Quaternion.RotationAxis(rotationAxis, angle);
            displacement.applyRotationQuaternionInPlace(quaternion);
            if (object.parentObject !== null) {
                translate(object.getTransform(), object.parentObject.getTransform().getAbsolutePosition());
            }
            translate(object.getTransform(), displacement);
        }

        this.update(Date.now() / 1000);
        for (let i = 0; i < nbWarmUpUpdates; i++) this.update(1);
    }

    /**
     * Inits the post processes of all the bodies in the system
     * @private
     */
    private initPostProcesses() {
        this.postProcessManager.addStarField(this.stellarObjects, this.celestialBodies, this.starfieldRotation);
        for (const object of this.orbitalObjects) {
            for (const postProcess of object.postProcesses) {
                switch (postProcess) {
                    case PostProcessType.RING:
                        if (!(object instanceof AbstractBody)) throw new Error("Rings post process can only be added to bodies. Source:" + object.name);
                        this.postProcessManager.addRings(object, this.stellarObjects);
                        break;
                    case PostProcessType.OVERLAY:
                        this.postProcessManager.addOverlay(object);
                        break;
                    case PostProcessType.ATMOSPHERE:
                        if (!(object instanceof GasPlanet) && !(object instanceof TelluricPlanemo))
                            throw new Error("Atmosphere post process can only be added to gas or telluric planets. Source:" + object.name);
                        this.postProcessManager.addAtmosphere(object as GasPlanet | TelluricPlanemo, this.stellarObjects);
                        break;
                    case PostProcessType.CLOUDS:
                        if (!(object instanceof TelluricPlanemo)) throw new Error("Clouds post process can only be added to telluric planets. Source:" + object.name);
                        this.postProcessManager.addClouds(object as TelluricPlanemo, this.stellarObjects);
                        break;
                    case PostProcessType.OCEAN:
                        if (!(object instanceof TelluricPlanemo)) throw new Error("Ocean post process can only be added to telluric planets. Source:" + object.name);
                        this.postProcessManager.addOcean(object as TelluricPlanemo, this.stellarObjects);
                        break;
                    case PostProcessType.VOLUMETRIC_LIGHT:
                        if (!(object instanceof Star)) throw new Error("Volumetric light post process can only be added to stars. Source:" + object.name);
                        this.postProcessManager.addVolumetricLight(object as Star);
                        break;
                    case PostProcessType.MANDELBULB:
                        if (!(object instanceof Mandelbulb)) throw new Error("Mandelbulb post process can only be added to mandelbulbs. Source:" + object.name);
                        this.postProcessManager.addMandelbulb(object as Mandelbulb, this.stellarObjects);
                        break;
                    case PostProcessType.BLACK_HOLE:
                        if (!(object instanceof BlackHole)) throw new Error("Black hole post process can only be added to black holes. Source:" + object.name);
                        this.postProcessManager.addBlackHole(object as BlackHole, this.starfieldRotation);
                        break;
                    case PostProcessType.MATTER_JETS:
                        if (!(object instanceof NeutronStar)) throw new Error("Matter jets post process can only be added to neutron stars. Source:" + object.name);
                        this.postProcessManager.addMatterJet(object as NeutronStar);
                        break;
                    case PostProcessType.SHADOW:
                        this.postProcessManager.addShadowCaster(object as AbstractBody, this.stellarObjects);
                        break;
                    case PostProcessType.LENS_FLARE:
                        this.postProcessManager.addLensFlare(object as StellarObject);
                        break;
                }
            }
        }
        this.postProcessManager.setBody(this.getNearestBody(this.scene.getActiveUberCamera().position));
    }

    /**
     * Updates the system and all its bodies forward in time by the given delta time
     * @param deltaTime The time elapsed since the last update
     */
    public update(deltaTime: number): void {
        const controller = this.scene.getActiveController();
        const nearestBody = this.getNearestBody(this.scene.getActiveUberCamera().position);

        const distanceOfNearestToCamera = Vector3.Distance(nearestBody.getTransform().getAbsolutePosition(), controller.getActiveCamera().getAbsolutePosition());
        const shouldCompensateTranslation = distanceOfNearestToCamera < nearestBody.getRadius() * 10;
        const shouldCompensateRotation = distanceOfNearestToCamera < nearestBody.getRadius() * 4;

        nearestBody.updateInternalClock(deltaTime);
        const initialPosition = nearestBody.getTransform().getAbsolutePosition().clone();
        nearestBody.updateOrbitalPosition(deltaTime);
        const newPosition = nearestBody.getTransform().getAbsolutePosition().clone();
        const nearestBodyDisplacement = newPosition.subtract(initialPosition);
        if (shouldCompensateTranslation) translate(nearestBody.getTransform(), nearestBodyDisplacement.negate());

        const dthetaNearest = nearestBody.getDeltaTheta(deltaTime);

        // if we don't compensate the rotation of the nearest body, we must rotate it accordingly
        if (!shouldCompensateRotation) nearestBody.updateRotation(deltaTime);

        // As the nearest object is kept in place, we need to transfer its movement to other bodies
        for (const object of this.orbitalObjects) {
            const oldOrbitNormal = object.model.orbit.normalToPlane.clone();
            if (shouldCompensateRotation) {
                // the normal to the orbit planes must be rotated as well (even the one of the nearest body)
                const rotation = Quaternion.RotationAxis(nearestBody.getRotationAxis(), -dthetaNearest);
                object.model.orbit.normalToPlane.applyRotationQuaternionInPlace(rotation);
            }
            if (object === nearestBody) continue;

            if (shouldCompensateTranslation) {
                // the body is translated so that the nearest body can stay in place
                translate(object.getTransform(), nearestBodyDisplacement.negate());
            }

            if (shouldCompensateRotation) {
                // if the nearest body does not rotate, all other bodies must revolve around it for consistency
                rotateAround(object.getTransform(), nearestBody.getTransform().getAbsolutePosition(), nearestBody.getRotationAxis(), -dthetaNearest);

                // we must as well rotate their rotation axis to keep consistency
                const newNormal = object.model.orbit.normalToPlane.clone();
                const angle = Math.acos(Vector3.Dot(oldOrbitNormal, newNormal));
                if (angle > 0.02) {
                    // FIXME: when time goes very fast, this will get wrongfully executed
                    const axis = Vector3.Cross(oldOrbitNormal, newNormal);
                    const quaternion = Quaternion.RotationAxis(axis, angle);
                    const newRotationAxis = object.getRotationAxis().applyRotationQuaternion(quaternion);
                    setUpVector(object.getTransform(), newRotationAxis);
                }
            }
        }

        if (shouldCompensateRotation) {
            // the starfield is rotated to give the impression the nearest body is rotating, which is not the case
            const starfieldAdditionalRotation = Quaternion.RotationAxis(nearestBody.getRotationAxis(), dthetaNearest);
            this.starfieldRotation.copyFrom(starfieldAdditionalRotation.multiply(this.starfieldRotation));
        }

        // finally, all other objects are updated normally
        for (const object of this.orbitalObjects) {
            if (object === nearestBody) continue;

            object.updateInternalClock(deltaTime);
            object.updateOrbitalPosition(deltaTime);
            object.updateRotation(deltaTime);
        }

        controller.update(deltaTime);

        for (const body of this.telluricPlanets.concat(this.satellites)) {
            // Meshes with LOD are updated (surface quadtrees)
            body.updateLOD(controller.getTransform().getAbsolutePosition());
        }

        for (const object of this.orbitalObjects) {
            // We disable objects that are too small on the screen
            object.computeCulling(controller.getActiveCamera());
        }

        // floating origin
        if (controller.getActiveCamera().getAbsolutePosition().length() > 0) {
            const displacementTranslation = controller.getTransform().getAbsolutePosition().negate();
            this.translateEverythingNow(displacementTranslation);
            translate(controller.getTransform(), displacementTranslation);
        }

        this.updateShaders(deltaTime);
    }

    public updateShaders(deltaTime: number) {
        const controller = this.scene.getActiveController();
        const nearestBody = this.getNearestBody(this.scene.getActiveUberCamera().position);

        for (const planet of this.planemosWithMaterial) {
            planet.updateMaterial(controller, this.stellarObjects, deltaTime);
        }

        for (const stellarObject of this.stellarObjects) {
            if (stellarObject instanceof Star) stellarObject.updateMaterial();
        }

        this.postProcessManager.setBody(nearestBody);
        const rings = this.postProcessManager.getRings(nearestBody);
        const switchLimit = rings !== null ? rings.ringsUniforms.ringStart : 2;
        if (isOrbiting(controller, nearestBody, switchLimit)) this.postProcessManager.setSurfaceOrder();
        else this.postProcessManager.setSpaceOrder();
        this.postProcessManager.update(deltaTime);
    }

    /**
     * Generates the system using the seed provided in the constructor
     */
    public generate() {
        this.makeStellarObjects(this.model.getNbStars());
        this.makePlanets(this.model.getNbPlanets());
    }

    public dispose() {
        this.postProcessManager.dispose();
        for (const spacestation of this.spaceStations) spacestation.dispose();
        for (const body of this.celestialBodies) body.dispose();
    }
}
