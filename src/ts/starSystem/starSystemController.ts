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
import { rotate, rotateAround, translate } from "../uberCore/transforms/basicTransform";
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
import { TransformNode } from "@babylonjs/core/Meshes";

export type PlanetarySystem = {
    readonly planets: Planet[];
    readonly satellites: TelluricPlanet[];
    readonly spaceStations: SpaceStation[];
};

export type SubStarSystem = {
    readonly stellarObjects: StellarObject[];
    readonly planetarySystems: PlanetarySystem[];
    readonly anomalies: CelestialBody[];
    readonly spaceStations: SpaceStation[];
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
    private readonly systemTargets: SystemTarget[] = [];

    private elapsedSeconds = 0;

    // variables used when loading the star system
    private readonly timeOut = 500;
    private loadingIndex = 0;
    private readonly offset = 1e8;

    private readonly rootTransform: TransformNode;

    /**
     * Creates a new star system controller from a given model and scene
     * Note that the star system is not loaded until the load method is called
     * @param model The data model of the star system
     * @param scene The scene in which the star system will be rendered
     */
    constructor(model: StarSystemModel, scene: UberScene) {
        this.scene = scene;
        this.model = model;

        this.rootTransform = new TransformNode(`${model.name}RootTransform`, scene);

        this.starFieldBox = new StarFieldBox(scene);
        this.starFieldBox.getTransform().parent = this.rootTransform;
    }

    /**
     * Loads the star system from the underlying data model.
     * This instantiates all stars, planets, satellites, anomalies and space stations in the star system.
     */
    public async load() {
        for (const subSystem of this.model.subSystems) {
            this.subSystems.push(await this.loadSubSystem(subSystem));
        }
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
            stellarObject.getTransform().parent = this.rootTransform;
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
            anomaly.getTransform().parent = this.rootTransform;
            anomalies.push(anomaly);

            this.objectToParents.set(anomaly, stellarObjects);

            anomaly.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            await wait(this.timeOut);
        }

        const spaceStations: SpaceStation[] = [];
        for (const spaceStationModel of subSystemModel.spaceStations) {
            const spaceStation = new SpaceStation(spaceStationModel, this.scene);
            spaceStations.push(spaceStation);
            spaceStation.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            spaceStation.getTransform().parent = this.rootTransform;

            this.objectToParents.set(spaceStation, stellarObjects);

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

            planet.getTransform().parent = this.rootTransform;

            planet.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            planets.push(planet);

            this.objectToParents.set(planet, stellarObjects);

            await wait(this.timeOut);
        }

        const satellites: TelluricPlanet[] = [];
        for (const satelliteModel of planetarySystemModel.satellites) {
            console.log("Loading satellite:", satelliteModel.name);
            const satellite = new TelluricPlanet(satelliteModel, this.scene);
            satellite.getTransform().parent = this.rootTransform;
            satellite.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));
            satellites.push(satellite);
            this.telluricBodies.push(satellite);
            this.objectToParents.set(satellite, planets);
            await wait(this.timeOut);
        }

        const spaceStations: SpaceStation[] = [];
        for (const spaceStationModel of planetarySystemModel.spaceStations) {
            console.log("Loading space station:", spaceStationModel.name);
            const spaceStation = new SpaceStation(spaceStationModel, this.scene);
            spaceStations.push(spaceStation);
            spaceStation.getTransform().parent = this.rootTransform;
            spaceStation.getTransform().setAbsolutePosition(new Vector3(this.offset * ++this.loadingIndex, 0, 0));

            this.objectToParents.set(spaceStation, planets);

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
        const celestialBodies = this.getCelestialBodies();
        const spaceStations = this.getSpaceStations();
        if (celestialBodies.length + spaceStations.length === 0) throw new Error("There are no orbital objects in the solar system");
        let nearest: OrbitalObject = celestialBodies[0];
        let smallerDistance = Number.POSITIVE_INFINITY;
        for (const body of celestialBodies) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.getRadius();
            if (distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        for (const spacestation of spaceStations) {
            const distance = spacestation.getTransform().getAbsolutePosition().subtract(position).length();
            if (distance < smallerDistance && distance < spacestation.getBoundingRadius() * 20) {
                nearest = spacestation;
                smallerDistance = distance;
            }
        }

        return nearest;
    }

    /**
     * Returns all the space stations in the star system
     */
    public getSpaceStations(): SpaceStation[] {
        const solarSpaceStations: SpaceStation[] = this.subSystems.flatMap((subSystem) => subSystem.spaceStations);
        const planetSpaceStations: SpaceStation[] = this.subSystems.flatMap((subSystem) => subSystem.planetarySystems.flatMap((planetarySystem) => planetarySystem.spaceStations));
        return solarSpaceStations.concat(planetSpaceStations);
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
        return [...this.getCelestialBodies(), ...this.getSpaceStations()];
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
        const playerPosition = controller.getTransform().getAbsolutePosition();

        const celestialBodies = this.getCelestialBodies();
        const stellarObjects = this.getStellarObjects();
        const spaceStations = this.getSpaceStations();
        const orbitalObjects = this.getOrbitalObjects();

        // The nearest body might have to be treated separately
        // The first step is to find the nearest body
        const nearestOrbitalObject = this.getNearestOrbitalObject(playerPosition);
        const nearestCelestialBody = this.getNearestCelestialBody(playerPosition);
        const ringUniforms = nearestCelestialBody.ringsUniforms;

        // Depending on the distance to the nearest body, we might have to compensate its translation and/or rotation
        // If we are very close, we want both translation and rotation to be compensated, so that the body appears to be fixed
        // When we are a bit further, we only need to compensate the translation as it would be unnatural not to see the body rotating
        const distanceOfNearestToControls = Vector3.Distance(nearestOrbitalObject.getTransform().getAbsolutePosition(), playerPosition);

        const shouldCompensateTranslation = distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * (nearestOrbitalObject instanceof SpaceStation ? 200 : 10);

        // compensate rotation when close to the body
        let shouldCompensateRotation = distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * 3;
        if (nearestOrbitalObject === nearestCelestialBody && ringUniforms !== null) {
            // or in the vicinity of the rings
            shouldCompensateRotation = shouldCompensateRotation || distanceOfNearestToControls < ringUniforms.model.ringEnd * nearestOrbitalObject.getBoundingRadius();
        }
        // and never compensate the rotation of a space station
        shouldCompensateRotation = shouldCompensateRotation && !(nearestOrbitalObject instanceof SpaceStation);
        // also never compensate the rotation of a black hole
        shouldCompensateRotation = shouldCompensateRotation && !(nearestOrbitalObject instanceof BlackHole);

        const initialPosition = nearestOrbitalObject.getTransform().getAbsolutePosition().clone();

        // finally, all other objects are updated normally
        for (const object of orbitalObjects) {
            const parents = this.objectToParents.get(object);
            if (parents === undefined) {
                throw new Error(`Parents of ${object.model.name} are not defined`);
            }

            OrbitalObjectUtils.SetOrbitalPosition(object, parents, this.elapsedSeconds);
            OrbitalObjectUtils.UpdateRotation(object, deltaSeconds);
        }

        if (shouldCompensateTranslation) {
            const newPosition = nearestOrbitalObject.getTransform().getAbsolutePosition().clone();
            translate(this.rootTransform, initialPosition.subtract(newPosition));
        }

        if (shouldCompensateRotation) {
            const dThetaNearest = OrbitalObjectUtils.GetRotationAngle(nearestOrbitalObject, deltaSeconds);

            rotate(nearestOrbitalObject.getTransform(), nearestOrbitalObject.getRotationAxis(), dThetaNearest);
            rotateAround(this.rootTransform, nearestOrbitalObject.getTransform().getAbsolutePosition(), nearestOrbitalObject.getRotationAxis(), -dThetaNearest);
        }

        controller.update(deltaSeconds);

        // floating origin
        this.applyFloatingOrigin();

        for (const object of celestialBodies) {
            object.asteroidField?.update(controller.getActiveCameras()[0].globalPosition, deltaSeconds);
        }

        for (const body of this.telluricBodies) {
            // Meshes with LOD are updated (surface quadtrees)
            body.updateLOD(playerPosition, chunkForge);
            body.computeCulling(controller.getActiveCameras());
        }

        for (const object of this.gasPlanets) {
            object.computeCulling(controller.getActiveCameras());
        }

        const cameraWorldPosition = controller.getTransform().getAbsolutePosition();
        for (const spaceStation of spaceStations) {
            spaceStation.update(stellarObjects, cameraWorldPosition, deltaSeconds);
            spaceStation.computeCulling(controller.getActiveCameras());
        }

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
            translate(this.rootTransform, displacementTranslation);
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

        placeholderTransform.getTransform().parent = this.rootTransform;

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

        this.rootTransform.dispose();
    }
}
