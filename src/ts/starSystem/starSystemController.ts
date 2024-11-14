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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { UberScene } from "../uberCore/uberScene";
import { SpaceStation } from "../spacestation/spaceStation";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { Mandelbulb } from "../anomalies/mandelbulb/mandelbulb";
import { rotateAround, translate } from "../uberCore/transforms/basicTransform";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { ChunkForge } from "../planets/telluricPlanet/terrain/chunks/chunkForge";
import { OrbitalObject, OrbitalObjectType, OrbitalObjectUtils } from "../architecture/orbitalObject";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";
import { PlanetaryMassObject } from "../architecture/planetaryMassObject";
import { SystemTarget } from "../utils/systemTarget";
import { JuliaSet } from "../anomalies/julia/juliaSet";
import { StarFieldBox } from "./starFieldBox";
import { PlanetarySystemModel, StarSystemModel, SubStarSystemModel } from "./starSystemModel";
import { Settings } from "../settings";
import { getStarGalacticPosition } from "../utils/coordinates/starSystemCoordinatesUtils";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { MandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { JuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { StarModel } from "../stellarObjects/star/starModel";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { wait } from "../utils/wait";
import { Planet } from "../architecture/planet";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { OrbitalFacility } from "../spacestation/orbitalFacility";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { SpaceElevator } from "../spacestation/spaceElevator";
import { SpaceElevatorModel } from "../spacestation/spaceElevatorModel";

export type PlanetarySystem = {
    readonly planets: Planet[];
    readonly satellites: TelluricPlanet[];
    readonly spaceStations: OrbitalFacility[];
};

export type SubStarSystem = {
    readonly stellarObjects: StellarObject[];
    readonly planetarySystems: PlanetarySystem[];
    readonly anomalies: CelestialBody[];
    readonly spaceStations: OrbitalFacility[];
};

/**
 * The controller of the star system manages all resources specific to a single star system.
 * Changing star system means destroying and creating a new controller.
 */
export class StarSystemController {
    readonly scene: UberScene;

    readonly starFieldBox: StarFieldBox;

    /**
     * The model of the star system that describes it and generates the randomness
     */
    readonly model: StarSystemModel;

    /**
     * Translation of the system data model in terms of actual 3D objects
     * @type {StarSystemModel}
     */
    readonly subSystems: SubStarSystem[] = [];

    /**
     * Relation between orbital objects and their parents
     */
    readonly objectToParents: Map<OrbitalObject, OrbitalObject[]> = new Map();

    private readonly telluricBodies: TelluricPlanet[] = [];
    private readonly gasPlanets: GasPlanet[] = [];

    /**
     * The list of all system targets in the system
     */
    private systemTargets: SystemTarget[] = [];

    private elapsedSeconds = 0;

    // variables used when loading the star system
    private timeOut = 500;
    private loadingIndex = 0;
    private offset = 1e8;

    /**
     * Creates a new star system controller from a given model and scene
     * Note that the star system is not loaded until the load method is called
     * @param model The data model of the star system
     * @param scene The scene in which the star system will be rendered
     */
    constructor(model: StarSystemModel, scene: UberScene) {
        this.scene = scene;
        this.starFieldBox = new StarFieldBox(scene);
        this.model = model;
    }

    /**
     * Loads the star system from the underlying data model.
     * This instantiates all stars, planets, satellites, anomalies and space stations in the star system.
     */
    public async load() {
        await wait(1000);
        for (const subSystem of this.model.subSystems) {
            this.subSystems.push(await this.loadSubSystem(subSystem));
        }
        await wait(1000);
    }

    private async loadSubSystem(subSystemModel: SubStarSystemModel): Promise<SubStarSystem> {
        const stellarObjects: StellarObject[] = [];
        for (const stellarObjectModel of subSystemModel.stellarObjects) {
            console.log("Loading stellar object:", stellarObjectModel.name);
            let stellarObject: StellarObject;
            switch (stellarObjectModel.type) {
                case OrbitalObjectType.STAR:
                    stellarObject = new Star(stellarObjectModel as StarModel, this.scene);
                    break;
                case OrbitalObjectType.BLACK_HOLE:
                    stellarObject = new BlackHole(stellarObjectModel as BlackHoleModel, this.scene);
                    break;
                case OrbitalObjectType.NEUTRON_STAR:
                    stellarObject = new NeutronStar(stellarObjectModel as NeutronStarModel, this.scene);
                    break;
                default:
                    throw new Error("Unknown stellar object type");
            }
            stellarObjects.push(stellarObject);
            this.objectToParents.set(stellarObject, []);
            stellarObject.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        const planetarySystems: PlanetarySystem[] = [];
        for (const planetarySystem of subSystemModel.planetarySystems) {
            planetarySystems.push(await this.loadPlanetarySystem(planetarySystem, stellarObjects));
        }

        const anomalies: CelestialBody[] = [];
        for (const anomalyModel of subSystemModel.anomalies) {
            console.log("Loading Anomaly:", anomalyModel.name);
            let anomaly: CelestialBody;
            switch (anomalyModel.type) {
                case OrbitalObjectType.MANDELBULB:
                    anomaly = new Mandelbulb(anomalyModel as MandelbulbModel, this.scene);
                    break;
                case OrbitalObjectType.JULIA_SET:
                    anomaly = new JuliaSet(anomalyModel as JuliaSetModel, this.scene);
                    break;
            }
            anomalies.push(anomaly);

            this.objectToParents.set(anomaly, stellarObjects);

            anomaly.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        const spaceStations: OrbitalFacility[] = [];
        for (const orbitalFacilityModel of subSystemModel.orbitalFacilities) {
            let orbitalFacility: OrbitalFacility;
            switch (orbitalFacilityModel.type) {
                case OrbitalObjectType.SPACE_STATION:
                    orbitalFacility = new SpaceStation(orbitalFacilityModel as SpaceStationModel, this.scene);
                    break;
                case OrbitalObjectType.SPACE_ELEVATOR:
                    throw new Error("A space elevator orbiting a star??? Sounds like a bad idea");
            }
            spaceStations.push(orbitalFacility);
            orbitalFacility.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            this.objectToParents.set(orbitalFacility, stellarObjects);

            await wait(this.timeOut);
        }

        return {
            stellarObjects,
            planetarySystems,
            anomalies,
            spaceStations
        };
    }

    private async loadPlanetarySystem(planetarySystemModel: PlanetarySystemModel, stellarObjects: StellarObject[]): Promise<PlanetarySystem> {
        const planets: Planet[] = [];
        for (const planetModel of planetarySystemModel.planets) {
            console.log("Loading planet", planetModel.name);

            let planet: Planet;

            switch (planetModel.type) {
                case OrbitalObjectType.TELLURIC_PLANET:
                    //FIXME: TelluricPlanet and TelluricSatellite should be 2 different types to avoid casting
                    planet = new TelluricPlanet(planetModel as TelluricPlanetModel, this.scene) as Planet;
                    this.telluricBodies.push(planet as TelluricPlanet);
                    break;
                case OrbitalObjectType.GAS_PLANET:
                    planet = new GasPlanet(planetModel as GasPlanetModel, this.scene);
                    this.gasPlanets.push(planet as GasPlanet);
                    break;
            }

            planet.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            planets.push(planet);

            this.objectToParents.set(planet, stellarObjects);

            await wait(this.timeOut);
        }

        const satellites: TelluricPlanet[] = [];
        for (const satelliteModel of planetarySystemModel.satellites) {
            console.log("Loading satellite:", satelliteModel.name);
            const satellite = new TelluricPlanet(satelliteModel, this.scene);
            satellite.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));
            satellites.push(satellite);
            this.telluricBodies.push(satellite);
            this.objectToParents.set(satellite, planets);
            await wait(this.timeOut);
        }

        const spaceStations: OrbitalFacility[] = [];
        for (const orbitalFacilityModel of planetarySystemModel.orbitalFacilities) {
            console.log("Loading space station:", orbitalFacilityModel.name);

            let orbitalFacility: OrbitalFacility;

            switch (orbitalFacilityModel.type) {
                case OrbitalObjectType.SPACE_STATION:
                    orbitalFacility = new SpaceStation(orbitalFacilityModel as SpaceStationModel, this.scene);
                    break;

                case OrbitalObjectType.SPACE_ELEVATOR:
                    orbitalFacility = new SpaceElevator(orbitalFacilityModel as SpaceElevatorModel, this.scene);
                    break;
            }

            spaceStations.push(orbitalFacility);
            orbitalFacility.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            this.objectToParents.set(orbitalFacility, planets);

            await wait(this.timeOut);
        }

        return {
            planets,
            satellites,
            spaceStations
        };
    }

    /**
     * Returns the nearest orbital object to the given position
     * @param position The position from which we want to find the nearest orbital object
     */
    public getNearestOrbitalObject(position: Vector3): OrbitalObject {
        const orbitalObjects = this.getOrbitalObjects();

        if (orbitalObjects.length === 0) throw new Error("There are no orbital objects in the solar system");
        let nearest: OrbitalObject = orbitalObjects[0];
        let smallerDistance = Number.POSITIVE_INFINITY;
        for (const body of orbitalObjects) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.getBoundingRadius();
            if (distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        return nearest;
    }

    /**
     * Returns all the space stations in the star system
     */
    public getOrbitalFacilities(): OrbitalFacility[] {
        const solarFacilities: OrbitalFacility[] = this.subSystems.flatMap((subSystem) => subSystem.spaceStations);
        const planetFacilities: OrbitalFacility[] = this.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => planetarySystem.spaceStations));
        return solarFacilities.concat(planetFacilities);
    }

    /**
     * Returns all the celestial bodies in the star system
     */
    public getCelestialBodies(): CelestialBody[] {
        const celestialBodies: CelestialBody[] = this.subSystems.flatMap((subSystem) => subSystem.stellarObjects);
        celestialBodies.push(
            ...this.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => [...planetarySystem.planets, ...planetarySystem.satellites]))
        );
        celestialBodies.push(...this.subSystems.flatMap((subSystem) => subSystem.anomalies));

        return celestialBodies;
    }

    /**
     * Returns all the stellar objects in the star system
     */
    public getStellarObjects(): StellarObject[] {
        return this.subSystems.flatMap((subSystem) => subSystem.stellarObjects);
    }

    /**
     * Returns all the orbital objects in the star system
     */
    public getOrbitalObjects(): OrbitalObject[] {
        return [...this.getCelestialBodies(), ...this.getOrbitalFacilities()];
    }

    /**
     * Returns all the planets in the star system
     */
    public getPlanets(): PlanetaryMassObject[] {
        return this.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => planetarySystem.planets));
    }

    /**
     * Returns all the planetary mass objects in the star system. (Planets first, then satellites)
     */
    public getPlanetaryMassObjects(): PlanetaryMassObject[] {
        const planets: PlanetaryMassObject[] = [];
        const satellites: PlanetaryMassObject[] = [];
        this.subSystems.forEach((subSystem) =>
            subSystem.planetarySystems.forEach((planetarySystem) => {
                planets.push(...planetarySystem.planets);
                satellites.push(...planetarySystem.satellites);
            })
        );

        return planets.concat(satellites);
    }

    /**
     * Returns all the anomalies in the star system
     */
    public getAnomalies(): CelestialBody[] {
        return this.subSystems.flatMap((subSystem) => subSystem.anomalies);
    }

    /**
     * Returns the parent objects of the given object
     * @param object The object for which we want to find the parents
     */
    public getParentsOf(object: OrbitalObject): OrbitalObject[] {
        return this.objectToParents.get(object) ?? [];
    }

    /**
     * Returns the nearest body to the given position
     */
    public getNearestCelestialBody(position: Vector3): CelestialBody {
        const celestialBodies = this.getCelestialBodies();
        if (celestialBodies.length === 0) throw new Error("There are no bodies or spacestation in the solar system");
        let nearest = null;
        let smallerDistance = -1;
        for (const body of celestialBodies) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.getRadius();
            if (nearest === null || distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        if (nearest === null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    /**
     * Inits the post processes and moves the system forward in time to the current time (it is additive)
     */
    public initPositions(nbWarmUpUpdates: number, chunkForge: ChunkForge, postProcessManager: PostProcessManager): void {
        this.update(Date.now() / 1000, chunkForge, postProcessManager);
        for (let i = 0; i < nbWarmUpUpdates; i++) this.update(1 / 60, chunkForge, postProcessManager);
    }

    /**
     * Inits the post processes of all the bodies in the system
     * This method cannot be awaited as its completion depends on the execution of BabylonJS that happens afterward.
     */
    public initPostProcesses(postProcessManager: PostProcessManager): void {
        const celestialBodies = this.getCelestialBodies();
        const stellarObjects = this.getStellarObjects();
        for (const object of celestialBodies) {
            for (const postProcess of object.postProcesses) {
                switch (postProcess) {
                    case PostProcessType.RING:
                        postProcessManager.addRings(object, stellarObjects);
                        break;
                    case PostProcessType.ATMOSPHERE:
                        if (!(object instanceof GasPlanet) && !(object instanceof TelluricPlanet))
                            throw new Error("Atmosphere post process can only be added to gas or telluric planets. Source:" + object.model.name);
                        postProcessManager.addAtmosphere(object as GasPlanet | TelluricPlanet, stellarObjects);
                        break;
                    case PostProcessType.CLOUDS:
                        if (!(object instanceof TelluricPlanet)) throw new Error("Clouds post process can only be added to telluric planets. Source:" + object.model.name);
                        postProcessManager.addClouds(object as TelluricPlanet, stellarObjects);
                        break;
                    case PostProcessType.OCEAN:
                        if (!(object instanceof TelluricPlanet)) throw new Error("Ocean post process can only be added to telluric planets. Source:" + object.model.name);
                        postProcessManager.addOcean(object as TelluricPlanet, stellarObjects);
                        break;
                    case PostProcessType.VOLUMETRIC_LIGHT:
                        if (!(object instanceof Star) && !(object instanceof NeutronStar))
                            throw new Error("Volumetric light post process can only be added to stars and neutron stars. Source:" + object.model.name);
                        postProcessManager.addVolumetricLight(object, [this.starFieldBox.mesh]);
                        break;
                    case PostProcessType.MANDELBULB:
                        if (!(object instanceof Mandelbulb)) throw new Error("Mandelbulb post process can only be added to mandelbulbs. Source:" + object.model.name);
                        postProcessManager.addMandelbulb(object as Mandelbulb, stellarObjects);
                        break;
                    case PostProcessType.JULIA_SET:
                        if (!(object instanceof JuliaSet)) throw new Error("Julia set post process can only be added to julia sets. Source:" + object.model.name);
                        postProcessManager.addJuliaSet(object as JuliaSet, stellarObjects);
                        break;
                    case PostProcessType.BLACK_HOLE:
                        if (!(object instanceof BlackHole)) throw new Error("Black hole post process can only be added to black holes. Source:" + object.model.name);
                        postProcessManager.addBlackHole(object as BlackHole);
                        break;
                    case PostProcessType.MATTER_JETS:
                        if (!(object instanceof NeutronStar)) throw new Error("Matter jets post process can only be added to neutron stars. Source:" + object.model.name);
                        postProcessManager.addMatterJet(object as NeutronStar);
                        break;
                    case PostProcessType.SHADOW:
                        postProcessManager.addShadowCaster(object, stellarObjects);
                        break;
                    case PostProcessType.LENS_FLARE:
                        postProcessManager.addLensFlare(object as StellarObject);
                        break;
                }
            }
        }

        postProcessManager.setCelestialBody(this.getNearestCelestialBody(this.scene.getActiveControls().getTransform().getAbsolutePosition()));
        postProcessManager.rebuild();
    }

    /**
     * Updates the system and all its orbital objects forward in time by the given delta time.
     * The nearest object is kept in place and the other objects are updated accordingly.
     * @param deltaSeconds The time elapsed since the last update
     * @param chunkForge The chunk forge used to update the LOD of the telluric planets
     * @param postProcessManager
     */
    public update(deltaSeconds: number, chunkForge: ChunkForge, postProcessManager: PostProcessManager): void {
        this.elapsedSeconds += deltaSeconds;

        const controller = this.scene.getActiveControls();

        const celestialBodies = this.getCelestialBodies();
        const stellarObjects = this.getStellarObjects();
        const orbitalFacilities = this.getOrbitalFacilities();
        const orbitalObjects = this.getOrbitalObjects();

        // The nearest body might have to be treated separately
        // The first step is to find the nearest body
        const nearestOrbitalObject = this.getNearestOrbitalObject(controller.getTransform().getAbsolutePosition());
        const nearestCelestialBody = this.getNearestCelestialBody(controller.getTransform().getAbsolutePosition());
        const ringUniforms = nearestCelestialBody.ringsUniforms;

        // Depending on the distance to the nearest body, we might have to compensate its translation and/or rotation
        // If we are very close, we want both translation and rotation to be compensated, so that the body appears to be fixed
        // When we are a bit further, we only need to compensate the translation as it would be unnatural not to see the body rotating
        const distanceOfNearestToControls = Vector3.Distance(nearestOrbitalObject.getTransform().getAbsolutePosition(), controller.getTransform().getAbsolutePosition());

        const shouldCompensateTranslation =
            distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * (nearestOrbitalObject.model.type === OrbitalObjectType.SPACE_STATION ? 200 : 10);

        // compensate rotation when close to the body
        let shouldCompensateRotation = distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * 3;
        if (nearestOrbitalObject === nearestCelestialBody && ringUniforms !== null) {
            // or in the vicinity of the rings
            shouldCompensateRotation = shouldCompensateRotation || distanceOfNearestToControls < ringUniforms.model.ringEnd * nearestOrbitalObject.getBoundingRadius();
        }
        // never compensate the rotation of a black hole
        shouldCompensateRotation = shouldCompensateRotation && !(nearestOrbitalObject instanceof BlackHole);

        // first, all other objects are updated normally
        for (const object of orbitalObjects) {
            if (object === nearestOrbitalObject) continue;

            const parents = this.objectToParents.get(object);
            if (parents === undefined) {
                throw new Error(`Parents of ${object.model.name} are not defined`);
            }

            OrbitalObjectUtils.SetOrbitalPosition(object, parents, this.elapsedSeconds);
            OrbitalObjectUtils.UpdateRotation(object, deltaSeconds);
        }

        // ROTATION COMPENSATION
        // If we have to compensate the rotation of the nearest body, there are multiple things to take into account
        // The orbital plane of the body can be described using its normal vector. When the body is not rotating, the normal vector will rotate in its stead.
        // You can draw a simple example to understand this: have a simple planet and its moon, but the moon's rotation axis on itself is tilted heavily.
        // Therefore, we have to rotate all the orbital planes accordingly.
        // Using the same example as before, it is trivial to see the planet will have to rotate around its moon.
        // Adding more bodies, we see that all bodies must rotate around the fixed moon.
        // By doing so, their rotation axis on themselves except the fixed one must as well be rotated in the same way.
        // Last but not least, the background starfield must be rotated in the opposite direction to give the impression the moon is rotating.
        if (shouldCompensateRotation) {
            const dThetaNearest = OrbitalObjectUtils.GetRotationAngle(nearestOrbitalObject, deltaSeconds);

            const nearestObjectRotationAxis = nearestOrbitalObject.getRotationAxis();

            for (const object of orbitalObjects) {
                const orbit = object.model.orbit;

                // the normal to the orbit planes must be rotated as well (even the one of the nearest body)
                const rotation = Quaternion.RotationAxis(nearestObjectRotationAxis, -dThetaNearest);
                rotation.multiplyToRef(orbit.orientation, orbit.orientation);

                if (object === nearestOrbitalObject) continue;

                // All other bodies must revolve around it for consistency (finally we can say the sun revolves around the earth!)
                rotateAround(object.getTransform(), nearestOrbitalObject.getTransform().getAbsolutePosition(), nearestObjectRotationAxis, -dThetaNearest);
            }

            this.systemTargets.forEach((target) => {
                rotateAround(target.getTransform(), nearestOrbitalObject.getTransform().getAbsolutePosition(), nearestObjectRotationAxis, -dThetaNearest);
            });

            // the starfield is rotated to give the impression the nearest body is rotating, which is only an illusion
            const starfieldAdditionalRotation = Matrix.RotationAxis(nearestObjectRotationAxis, dThetaNearest);
            this.starFieldBox.setRotationMatrix(starfieldAdditionalRotation.multiply(this.starFieldBox.getRotationMatrix()));
        } else {
            // if we don't compensate the rotation of the nearest body, we must simply update its rotation
            OrbitalObjectUtils.UpdateRotation(nearestOrbitalObject, deltaSeconds);
        }

        // TRANSLATION COMPENSATION
        // Compensating the translation is much easier in comparison. We save the initial position of the nearest body and
        // compute what would be its next position if it were to move normally.
        // This gives us a translation vector that we can negate and apply to all other bodies.
        const initialPosition = nearestOrbitalObject.getTransform().getAbsolutePosition().clone();
        const nearestObjectParents = this.objectToParents.get(nearestOrbitalObject);
        if (nearestObjectParents === undefined) {
            throw new Error("Nearest object parents are not defined");
        }
        const newPosition = OrbitalObjectUtils.GetOrbitalPosition(nearestOrbitalObject, nearestObjectParents, this.elapsedSeconds);

        const nearestBodyDisplacement = newPosition.subtract(initialPosition);
        if (shouldCompensateTranslation) {
            const negatedDisplacement = nearestBodyDisplacement.negate();
            for (const object of orbitalObjects) {
                if (object === nearestOrbitalObject) continue;

                // the body is translated so that the nearest body can stay in place
                translate(object.getTransform(), negatedDisplacement);
            }

            this.systemTargets.forEach((target) => {
                translate(target.getTransform(), negatedDisplacement);
            });
        } else {
            // if we don't compensate the translation of the nearest body, we must simply update its position
            translate(nearestOrbitalObject.getTransform(), nearestBodyDisplacement);
        }

        controller.update(deltaSeconds);

        for (const object of celestialBodies) {
            object.asteroidField?.update(controller.getActiveCamera().globalPosition, deltaSeconds);
        }

        for (const body of this.telluricBodies) {
            // Meshes with LOD are updated (surface quadtrees)
            body.updateLOD(controller.getTransform().getAbsolutePosition(), chunkForge);
            body.computeCulling(controller.getActiveCamera());
        }

        for (const object of this.gasPlanets) {
            object.computeCulling(controller.getActiveCamera());
        }

        const cameraWorldPosition = controller.getTransform().getAbsolutePosition();
        for (const orbitalFacility of orbitalFacilities) {
            orbitalFacility.update(stellarObjects, this.objectToParents.get(orbitalFacility) ?? [], cameraWorldPosition, deltaSeconds);
            orbitalFacility.computeCulling(controller.getActiveCamera());
        }

        // floating origin
        this.applyFloatingOrigin();

        this.updateShaders(deltaSeconds, postProcessManager);
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateEverythingNow(displacement: Vector3): void {
        const orbitalObjects = this.getOrbitalObjects();
        for (const object of orbitalObjects) translate(object.getTransform(), displacement);
        this.systemTargets.forEach((target) => translate(target.getTransform(), displacement));
    }

    public applyFloatingOrigin() {
        const controller = this.scene.getActiveControls();
        if (controller.getTransform().getAbsolutePosition().length() > Settings.FLOATING_ORIGIN_THRESHOLD) {
            const displacementTranslation = controller.getTransform().getAbsolutePosition().negate();
            this.translateEverythingNow(displacementTranslation);
            if (controller.getTransform().parent === null) {
                translate(controller.getTransform(), displacementTranslation);
            }
        }
    }

    /**
     * Updates the shaders of all the bodies in the system with the given delta time
     * @param deltaSeconds The time elapsed in seconds since the last update
     * @param postProcessManager
     */
    public updateShaders(deltaSeconds: number, postProcessManager: PostProcessManager) {
        const nearestBody = this.getNearestCelestialBody(this.scene.getActiveControls().getTransform().getAbsolutePosition());

        const stellarObjects = this.getStellarObjects();
        const planetaryMassObjects = this.getPlanetaryMassObjects();

        for (const planet of planetaryMassObjects) {
            planet.updateMaterial(stellarObjects, deltaSeconds);
        }

        for (const stellarObject of stellarObjects) {
            //FIXME: this needs to be refactored to be future proof when adding new stellar objects
            if (stellarObject instanceof Star) stellarObject.updateMaterial(deltaSeconds);
        }

        postProcessManager.setCelestialBody(nearestBody);
        postProcessManager.update(deltaSeconds);
    }

    addSystemTarget(targetCoordinates: StarSystemCoordinates): SystemTarget {
        const currentSystemUniversePosition = getStarGalacticPosition(this.model.coordinates);
        const targetSystemUniversePosition = getStarGalacticPosition(targetCoordinates);

        const distance = Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition) * Settings.LIGHT_YEAR;

        const direction = targetSystemUniversePosition.subtract(currentSystemUniversePosition).scaleInPlace(Settings.LIGHT_YEAR / distance);
        Vector3.TransformCoordinatesToRef(direction, this.starFieldBox.getRotationMatrix(), direction);

        const placeholderTransform = new SystemTarget(targetCoordinates, this.scene);
        placeholderTransform.getTransform().position.copyFrom(direction.scale(distance));

        this.systemTargets.push(placeholderTransform);

        return placeholderTransform;
    }

    getSystemTargets(): SystemTarget[] {
        return this.systemTargets;
    }

    /**
     * Disposes all the bodies in the system
     */
    public dispose() {
        this.objectToParents.clear();
        this.telluricBodies.length = 0;
        this.gasPlanets.length = 0;

        this.subSystems.forEach((subSystem) => {
            subSystem.stellarObjects.forEach((stellarObject) => stellarObject.dispose());
            subSystem.stellarObjects.length = 0;

            subSystem.planetarySystems.forEach((planetarySystem) => {
                planetarySystem.planets.forEach((planet) => planet.dispose());
                planetarySystem.planets.length = 0;
                planetarySystem.satellites.forEach((satellite) => satellite.dispose());
                planetarySystem.satellites.length = 0;
                planetarySystem.spaceStations.forEach((spaceStation) => spaceStation.dispose());
                planetarySystem.spaceStations.length = 0;
            });

            subSystem.anomalies.forEach((anomaly) => anomaly.dispose());
            subSystem.anomalies.length = 0;

            subSystem.spaceStations.forEach((spaceStation) => spaceStation.dispose());
            subSystem.spaceStations.length = 0;
        });

        this.systemTargets.forEach((target) => target.dispose());
        this.systemTargets.length = 0;

        this.starFieldBox.dispose();
    }
}
