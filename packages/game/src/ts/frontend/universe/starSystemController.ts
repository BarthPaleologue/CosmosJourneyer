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

import { type Color3, Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import type { DeepReadonly, NonEmptyArray } from "@cosmos-journeyer/typescript";
import {
    type OrbitalObjectId,
    type StarSystemCoordinates,
    type StarSystemModel,
} from "@cosmos-journeyer/universe-model";

import { type UniverseBackend } from "@/backend/universe/universeBackend";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { SystemTarget } from "@/frontend/universe/systemTarget";

import { Settings } from "@/settings";

import { FloatingOriginSystem } from "../helpers/floatingOriginSystem";
import { StellarLightSystem } from "../helpers/stellarLightSystem";
import {
    type Anomaly,
    type CelestialBody,
    type OrbitalFacility,
    type OrbitalObject,
    type Planet,
    type StellarObject,
} from "./architecture/orbitalObject";
import { GravitySystem } from "./gravitySystem";
import { KeplerianOrbitalSimulation, type OrbitalTransform } from "./keplerianOrbitalSimulation";
import type { GasPlanet } from "./planets/gasPlanet/gasPlanet";
import { TelluricPlanet } from "./planets/telluricPlanet/telluricPlanet";
import { type ChunkForge } from "./planets/telluricPlanet/terrain/chunks/chunkForge";
import { ScatteringSystem } from "./planets/telluricPlanet/terrain/chunks/scatteringSystem";
import { StarFieldBox } from "./starFieldBox";
import { type StarSystemLoader } from "./starSystemLoader";

/**
 * The controller of the star system manages all resources specific to a single star system.
 * Changing star system means destroying and creating a new controller.
 */
export class StarSystemController {
    readonly scene: Scene;

    readonly starFieldBox: StarFieldBox;

    private readonly referencePlaneRotation = Matrix.Identity();

    private readonly referenceAnchorPosition = Vector3.Zero();

    /**
     * The model of the star system that describes it and generates the randomness
     */
    readonly model: DeepReadonly<StarSystemModel>;

    private readonly stellarObjects: Readonly<NonEmptyArray<StellarObject>>;

    private readonly planets: ReadonlyArray<Planet> = [];

    private readonly satellites: ReadonlyArray<TelluricPlanet> = [];

    private readonly anomalies: ReadonlyArray<Anomaly> = [];

    private readonly orbitalFacilities: ReadonlyArray<OrbitalFacility> = [];

    private readonly orbitalFacilityToParents: Map<OrbitalFacility, ReadonlyArray<OrbitalObject>> = new Map();

    private readonly orbitalSimulation: KeplerianOrbitalSimulation;

    /**
     * The list of all system targets in the system
     */
    private systemTargets: Array<SystemTarget> = [];

    private elapsedSeconds = 0;

    private readonly orbitalSimulationTimeMultiplier = 1;

    private readonly assets: RenderingAssets;

    readonly gravitySystem: GravitySystem;
    private readonly floatingOriginSystem: FloatingOriginSystem;
    readonly stellarLightSystem: StellarLightSystem;

    private readonly scatteringSystem: ScatteringSystem;

    /**
     * Creates a new star system controller from a given model and scene
     * Note that the star system is not loaded until the load method is called
     * @param model The data model of the star system
     * @param scene The scene in which the star system will be rendered
     */
    private constructor(
        model: DeepReadonly<StarSystemModel>,
        orbitalObjects: {
            stellarObjects: Readonly<NonEmptyArray<StellarObject>>;
            planets: ReadonlyArray<Planet>;
            satellites: ReadonlyArray<TelluricPlanet>;
            anomalies: ReadonlyArray<Anomaly>;
            orbitalFacilities: ReadonlyArray<OrbitalFacility>;
        },
        assets: RenderingAssets,
        scene: Scene,
    ) {
        this.scene = scene;
        this.starFieldBox = new StarFieldBox(assets.textures.environment.milkyWay, 1000e3, scene);
        this.model = model;

        this.assets = assets;

        this.stellarObjects = orbitalObjects.stellarObjects;
        this.planets = orbitalObjects.planets;
        this.satellites = orbitalObjects.satellites;
        this.anomalies = orbitalObjects.anomalies;
        this.orbitalFacilities = orbitalObjects.orbitalFacilities;

        this.gravitySystem = new GravitySystem(this.scene);
        this.floatingOriginSystem = new FloatingOriginSystem(this.scene, Settings.FLOATING_ORIGIN_THRESHOLD);
        this.stellarLightSystem = new StellarLightSystem(this.scene);
        this.scatteringSystem = new ScatteringSystem(this.assets.objects, this.stellarLightSystem, this.scene);

        for (const orbitalFacility of this.orbitalFacilities) {
            this.orbitalFacilityToParents.set(
                orbitalFacility,
                this.getOrbitalObjects().filter((otherObject) =>
                    orbitalFacility.model.orbit.parentIds.includes(otherObject.model.id),
                ),
            );
        }
        this.orbitalSimulation = new KeplerianOrbitalSimulation(this.getOrbitalObjects());

        for (const stellarObject of this.stellarObjects) {
            let color: Color3 | null;
            if (stellarObject.type === "blackHole") {
                const accretionDisk = stellarObject.accretionDisk;
                if (accretionDisk === null) {
                    continue;
                }

                color = accretionDisk.getEmissiveColor();
            } else {
                color = stellarObject.getEmissiveColor();
            }

            this.stellarLightSystem.registerStellarObject(stellarObject.getTransform(), color);
        }
    }

    public static async CreateAsync(
        model: DeepReadonly<StarSystemModel>,
        loader: StarSystemLoader,
        assets: RenderingAssets,
        scene: Scene,
        progressMonitor: ILoadingProgressMonitor,
    ): Promise<StarSystemController> {
        const result = await loader.load(model, assets, scene, progressMonitor);
        return new StarSystemController(model, result, assets, scene);
    }

    public getMostInfluentialObject(position: Vector3): OrbitalObject {
        const orbitalObjects = this.getOrbitalObjects();

        let greatestInfluence = Number.NEGATIVE_INFINITY;
        let bestObject: OrbitalObject = this.stellarObjects[0];
        for (const object of orbitalObjects) {
            const distanceSquared = Vector3.DistanceSquared(object.getTransform().position, position);
            const influence = object.getBoundingRadius() / distanceSquared ** 2;

            if (influence > greatestInfluence) {
                greatestInfluence = influence;
                bestObject = object;
            }
        }

        return bestObject;
    }

    /**
     * Returns the nearest orbital object to the given position
     * @param position The position from which we want to find the nearest orbital object
     */
    public getNearestOrbitalObject(position: Vector3): OrbitalObject {
        const orbitalObjects = this.getOrbitalObjects();

        let nearest: OrbitalObject = this.stellarObjects[0];
        let smallerDistance = Number.POSITIVE_INFINITY;
        for (const body of orbitalObjects) {
            const distance =
                body.getTransform().getAbsolutePosition().subtract(position).length() - body.getBoundingRadius();
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
    public getOrbitalFacilities(): ReadonlyArray<OrbitalFacility> {
        return this.orbitalFacilities;
    }

    /**
     * Returns all the celestial bodies in the star system
     */
    public getCelestialBodies(): ReadonlyArray<CelestialBody> {
        return [...this.getStellarObjects(), ...this.getPlanetaryMassObjects(), ...this.getAnomalies()];
    }

    /**
     * Returns all the stellar objects in the star system
     */
    public getStellarObjects(): Readonly<NonEmptyArray<StellarObject>> {
        return this.stellarObjects;
    }

    /**
     * Returns all the orbital objects in the star system
     */
    public getOrbitalObjects(): ReadonlyArray<OrbitalObject> {
        return [...this.getCelestialBodies(), ...this.getOrbitalFacilities()];
    }

    /**
     * Returns all the planets in the star system
     */
    public getPlanets(): ReadonlyArray<Planet> {
        return this.planets;
    }

    public getTelluricPlanets(): ReadonlyArray<TelluricPlanet> {
        return this.getPlanets().filter((planet) => planet instanceof TelluricPlanet);
    }

    public getGasPlanets(): ReadonlyArray<GasPlanet> {
        return this.getPlanets().filter((planet) => planet.type === "gasPlanet");
    }

    /**
     * Returns all the planetary mass objects in the star system. (Planets first, then satellites)
     */
    public getPlanetaryMassObjects(): ReadonlyArray<Planet> {
        return [...this.getPlanets(), ...this.satellites];
    }

    /**
     * Returns all the anomalies in the star system
     */
    public getAnomalies(): ReadonlyArray<Anomaly> {
        return this.anomalies;
    }

    /**
     * Returns the nearest body to the given position
     */
    public getNearestCelestialBody(position: Vector3): CelestialBody {
        const celestialBodies = this.getCelestialBodies();
        let nearest: CelestialBody = this.stellarObjects[0];
        let smallerDistance = Number.POSITIVE_INFINITY;
        for (const body of celestialBodies) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.getRadius();
            if (distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        return nearest;
    }

    private applyRelativeOrbitalTransform(
        object: OrbitalObject,
        relativeTransform: OrbitalTransform,
        referenceAnchorPosition: Vector3,
        referenceAnchorOrientation: Quaternion,
    ): void {
        const transform = object.getTransform();
        relativeTransform.position.applyRotationQuaternionToRef(referenceAnchorOrientation, transform.position);
        transform.position.addInPlace(referenceAnchorPosition);

        transform.rotationQuaternion ??= Quaternion.Identity();
        referenceAnchorOrientation.multiplyToRef(relativeTransform.orientation, transform.rotationQuaternion);
        transform.computeWorldMatrix(true);
    }

    /**
     * Inits the post processes and moves the system forward in time to the current time (it is additive)
     * Uses updateOrbitalSimulation to avoid feeding large deltaSeconds to ship systems.
     * @param nbWarmUpUpdates Number of additional small updates to stabilize the simulation
     * @param chunkForge The chunk forge used for terrain generation
     * @param timestampSeconds The timestamp to which we want to advance the simulation (in seconds)
     */
    public initPositions(nbWarmUpUpdates: number, chunkForge: ChunkForge, timestampSeconds: number): void {
        this.updateOrbitalSimulation(this.stellarObjects[0], timestampSeconds);

        // Perform warm-up updates with small time steps
        for (let i = 0; i < nbWarmUpUpdates; i++) this.updateOrbitalSimulation(this.stellarObjects[0], 1);
    }

    /**
     * Updates only the orbital simulation forward in time.
     * The scene objects are moved relative to the reference object that stays in place for stability reasons.
     * @param referenceObject The object that will be kept in place while the others are moved around it
     * @param deltaSeconds The time elapsed since the last update
     */
    private updateOrbitalSimulation(referenceObject: OrbitalObject, deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;

        this.referenceAnchorPosition.copyFrom(referenceObject.getTransform().position);

        const referenceAnchorOrientation =
            referenceObject.getTransform().rotationQuaternion?.clone() ?? Quaternion.Identity();

        this.orbitalSimulation.update(this.elapsedSeconds);

        const referenceTransform = this.orbitalSimulation.getTransform(referenceObject.model.id);
        if (referenceTransform === undefined) {
            console.warn(`Could not compute orbital transform for ${referenceObject.model.name}`);
            return;
        }

        const relativeTransformFrame =
            referenceObject.type === "blackHole" || referenceObject.type === "neutronStar" ? "inertial" : "reference";
        const localFrameOrientation =
            relativeTransformFrame === "reference"
                ? referenceAnchorOrientation.multiply(referenceTransform.orientation.conjugate())
                : Quaternion.FromRotationMatrix(this.referencePlaneRotation);
        localFrameOrientation.toRotationMatrix(this.referencePlaneRotation);

        this.starFieldBox.setRotationMatrix(this.referencePlaneRotation.transpose());

        for (const object of this.getOrbitalObjects()) {
            const relativeTransform = this.orbitalSimulation.getRelativeTransform(
                object.model.id,
                referenceObject.model.id,
                relativeTransformFrame,
            );
            if (relativeTransform === undefined) {
                console.warn(`Could not compute orbital transform for ${object.model.name}`);
                continue;
            }

            this.applyRelativeOrbitalTransform(
                object,
                relativeTransform,
                this.referenceAnchorPosition,
                relativeTransformFrame === "reference" ? referenceAnchorOrientation : localFrameOrientation,
            );
        }
    }

    /**
     * Updates the system and all its orbital objects forward in time by the given delta time.
     * The nearest object is kept in place and the other objects are updated accordingly.
     * @param deltaSeconds The time elapsed since the last update
     * @param chunkForge The chunk forge used to update the LOD of the telluric planets
     */
    public update(deltaSeconds: number, chunkForge: ChunkForge): void {
        const camera = this.scene.activeCamera;
        if (camera === null) {
            console.warn("No camera!");
            return;
        }

        const cameraPosition = camera.globalPosition;

        const referenceObject = this.getMostInfluentialObject(cameraPosition);
        this.updateOrbitalSimulation(referenceObject, deltaSeconds * this.orbitalSimulationTimeMultiplier);

        for (const systemTarget of this.systemTargets) {
            systemTarget.updatePosition(this.referencePlaneRotation, this.referenceAnchorPosition);
        }

        for (const object of this.getCelestialBodies()) {
            object.asteroidField?.update(cameraPosition, this.assets.objects.asteroids, deltaSeconds);
        }

        for (const orbitalFacility of this.getOrbitalFacilities()) {
            const parents = this.orbitalFacilityToParents.get(orbitalFacility) ?? [];
            orbitalFacility.update(parents, cameraPosition, deltaSeconds);
            orbitalFacility.computeCulling(camera);
        }

        // Update planet LOD and culling
        for (const object of this.getPlanetaryMassObjects()) {
            object.computeCulling(camera);
            if (object.type === "telluricPlanet" || object.type === "telluricSatellite") {
                object.updateLOD(camera, chunkForge, this.scatteringSystem);
            }
        }

        this.gravitySystem.update(
            this.getCelestialBodies().map((body) => ({
                name: body.model.name,
                radius: body.getBoundingRadius(),
                position: body.getTransform().getAbsolutePosition(),
                mass: body.model.mass,
            })),
        );

        this.floatingOriginSystem.update(cameraPosition);

        this.updateShaders(deltaSeconds);
    }

    /**
     * Updates the material shaders of all the bodies in the system with the given delta time
     * @param deltaSeconds The time elapsed in seconds since the last update
     */
    private updateShaders(deltaSeconds: number) {
        const camera = this.scene.activeCamera;
        if (camera === null) {
            console.warn("No camera!");
            return;
        }

        camera.getViewMatrix(true);
        const cameraPosition = camera.globalPosition;

        this.stellarLightSystem.update(camera, this.getNearestCelestialBody(cameraPosition));
        const lightSources = this.stellarLightSystem.getLights();
        for (const planet of this.getGasPlanets()) {
            planet.updateMaterial(lightSources, deltaSeconds);
        }

        const stars = this.getStellarObjects().filter((object) => object.type === "star");
        for (const star of stars) {
            star.updateMaterial(deltaSeconds);
        }
    }

    addSystemTarget(targetCoordinates: StarSystemCoordinates, universeBackend: UniverseBackend): SystemTarget | null {
        const currentSystemUniversePosition = wrapVector3(
            universeBackend.getSystemGalacticPosition(this.model.coordinates),
        );
        const targetSystemUniversePosition = wrapVector3(universeBackend.getSystemGalacticPosition(targetCoordinates));

        const distance = lightYearsToMeters(
            Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition),
        );

        const direction = targetSystemUniversePosition.subtract(currentSystemUniversePosition).normalize();

        const systemModel = universeBackend.getSystemModelFromCoordinates(targetCoordinates);
        if (systemModel === null) {
            return null;
        }
        const placeholderTransform = new SystemTarget(systemModel, direction.scale(distance), this.scene);
        placeholderTransform.updatePosition(this.referencePlaneRotation, this.referenceAnchorPosition);

        this.systemTargets.push(placeholderTransform);

        return placeholderTransform;
    }

    getSystemTargets(): SystemTarget[] {
        return this.systemTargets;
    }

    public getReferencePlaneRotation(): Matrix {
        return this.referencePlaneRotation;
    }

    public getOrbitalObjectById(id: OrbitalObjectId) {
        return this.getOrbitalObjects().find((object) => object.model.id === id);
    }

    /**
     * Disposes all the bodies in the system
     */
    public dispose() {
        this.scatteringSystem.dispose();
        this.orbitalFacilityToParents.clear();

        this.stellarLightSystem.dispose();

        const pools = this.assets.textures.pools;

        this.orbitalFacilities.forEach((facility) => {
            facility.dispose();
        });
        this.anomalies.forEach((anomaly) => {
            anomaly.dispose();
        });
        this.satellites.forEach((satellite) => {
            satellite.dispose(pools.ringsPatternLut, pools.cloudsLut);
        });
        this.planets.forEach((planet) => {
            planet.dispose(pools.ringsPatternLut, pools.cloudsLut);
        });
        this.stellarObjects.forEach((stellarObject) => {
            stellarObject.dispose(pools.ringsPatternLut);
        });

        this.systemTargets.forEach((target) => {
            target.dispose();
        });
        this.systemTargets.length = 0;

        this.starFieldBox.dispose();
    }
}
