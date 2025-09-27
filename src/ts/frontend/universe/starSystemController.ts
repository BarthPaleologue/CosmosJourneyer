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

import { Matrix } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type OrbitalObjectId } from "@/backend/universe/orbitalObjects/orbitalObjectId";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { translate } from "@/frontend/uberCore/transforms/basicTransform";
import { type UberScene } from "@/frontend/uberCore/uberScene";
import {
    getOrbitalPosition,
    getRotationAngle,
    setOrbitalPosition,
    setRotation,
} from "@/frontend/universe/architecture/orbitalObjectUtils";
import { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { Star } from "@/frontend/universe/stellarObjects/star/star";
import { SystemTarget } from "@/frontend/universe/systemTarget";

import { lightYearsToMeters } from "@/utils/physics/unitConversions";
import { type DeepReadonly, type NonEmptyArray } from "@/utils/types";

import { Settings } from "@/settings";

import {
    type Anomaly,
    type CelestialBody,
    type OrbitalFacility,
    type OrbitalObject,
    type Planet,
    type StellarObject,
} from "./architecture/orbitalObject";
import { TelluricPlanet } from "./planets/telluricPlanet/telluricPlanet";
import { type ChunkForge } from "./planets/telluricPlanet/terrain/chunks/chunkForge";
import { StarFieldBox } from "./starFieldBox";
import { type StarSystemLoader } from "./starSystemLoader";

/**
 * The controller of the star system manages all resources specific to a single star system.
 * Changing star system means destroying and creating a new controller.
 */
export class StarSystemController {
    readonly scene: UberScene;

    readonly starFieldBox: StarFieldBox;

    private readonly referencePlaneRotation = Matrix.Identity();

    private readonly referencePosition = new Vector3(0, 0, 0);

    /**
     * The model of the star system that describes it and generates the randomness
     */
    readonly model: DeepReadonly<StarSystemModel>;

    private readonly stellarObjects: Readonly<NonEmptyArray<StellarObject>>;

    private readonly planets: ReadonlyArray<Planet> = [];

    private readonly satellites: ReadonlyArray<TelluricPlanet> = [];

    private readonly anomalies: ReadonlyArray<Anomaly> = [];

    private readonly orbitalFacilities: ReadonlyArray<OrbitalFacility> = [];

    private readonly objectToParents: Map<OrbitalObject, OrbitalObject[]> = new Map();

    /**
     * The list of all system targets in the system
     */
    private systemTargets: Array<SystemTarget> = [];

    private elapsedSeconds = 0;

    private readonly assets: RenderingAssets;

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
        scene: UberScene,
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

        this.getOrbitalObjects().forEach((object) => {
            this.objectToParents.set(
                object,
                this.getOrbitalObjects().filter((otherObject) =>
                    object.model.orbit.parentIds.includes(otherObject.model.id),
                ),
            );
        });
    }

    public static async CreateAsync(
        model: DeepReadonly<StarSystemModel>,
        loader: StarSystemLoader,
        assets: RenderingAssets,
        scene: UberScene,
    ): Promise<StarSystemController> {
        const result = await loader.load(model, assets, scene);
        return new StarSystemController(model, result, assets, scene);
    }

    public getMostInfluentialObject(position: Vector3): OrbitalObject {
        const orbitalObjects = this.getOrbitalObjects();

        let bestRelativeDistance = Number.POSITIVE_INFINITY;
        let bestObject = orbitalObjects[0];
        if (bestObject === undefined) {
            throw new Error("There are no orbital objects in the solar system");
        }
        for (const object of orbitalObjects) {
            const distance = Vector3.Distance(object.getTransform().position, position);
            const relativeDistance = distance / object.getBoundingRadius();

            if (relativeDistance < bestRelativeDistance) {
                bestRelativeDistance = relativeDistance;
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

        let nearest = orbitalObjects[0];
        if (nearest === undefined) {
            throw new Error("There are no orbital objects in the solar system");
        }
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
    public initPositions(nbWarmUpUpdates: number, chunkForge: ChunkForge): void {
        this.update(Date.now() / 1000, chunkForge);
        for (let i = 0; i < nbWarmUpUpdates; i++) this.update(1 / 60, chunkForge);
    }

    /**
     * Updates the system and all its orbital objects forward in time by the given delta time.
     * The nearest object is kept in place and the other objects are updated accordingly.
     * @param deltaSeconds The time elapsed since the last update
     * @param chunkForge The chunk forge used to update the LOD of the telluric planets
     */
    public update(deltaSeconds: number, chunkForge: ChunkForge): void {
        this.elapsedSeconds += deltaSeconds;

        const controls = this.scene.getActiveControls();
        const controlsPosition = controls.getTransform().getAbsolutePosition();

        const celestialBodies = this.getCelestialBodies();
        const orbitalFacilities = this.getOrbitalFacilities();
        const orbitalObjects = this.getOrbitalObjects();

        // The nearest body might have to be treated separately
        // The first step is to find the nearest body
        const nearestOrbitalObject = this.getMostInfluentialObject(controlsPosition);
        const nearestCelestialBody = this.getNearestCelestialBody(controlsPosition);
        const ringUniforms = nearestCelestialBody.ringsUniforms;

        // Depending on the distance to the nearest body, we might have to compensate its translation and/or rotation
        // If we are very close, we want both translation and rotation to be compensated, so that the body appears to be fixed
        // When we are a bit further, we only need to compensate the translation as it would be unnatural not to see the body rotating
        const distanceOfNearestToControls = Vector3.Distance(
            nearestOrbitalObject.getTransform().position,
            controlsPosition,
        );

        // compensate rotation when close to the body
        let shouldCompensateRotation = distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * 3;
        if (nearestOrbitalObject === nearestCelestialBody && ringUniforms !== null) {
            // or in the vicinity of the rings
            shouldCompensateRotation =
                shouldCompensateRotation || distanceOfNearestToControls < ringUniforms.model.outerRadius;
        }
        // never compensate the rotation of a black hole
        shouldCompensateRotation = shouldCompensateRotation && !(nearestOrbitalObject instanceof BlackHole);

        // ROTATION COMPENSATION
        // If we have to compensate the rotation of the nearest body, we must rotate the reference plane instead
        if (shouldCompensateRotation) {
            const dThetaNearest = getRotationAngle(nearestOrbitalObject, deltaSeconds);

            const nearestObjectRotationAxis = nearestOrbitalObject.getTransform().up.clone();
            Vector3.TransformNormalToRef(
                nearestObjectRotationAxis,
                this.referencePlaneRotation.transpose(),
                nearestObjectRotationAxis,
            );

            const rotation = Matrix.RotationAxis(nearestObjectRotationAxis, -dThetaNearest);

            // update the reference plane rotation
            rotation.multiplyToRef(this.referencePlaneRotation, this.referencePlaneRotation);

            // the starfield is rotated to give the impression the nearest body is rotating, which is only an illusion
            this.starFieldBox.setRotationMatrix(this.referencePlaneRotation.transpose());
        } else {
            // if we don't compensate the rotation of the nearest body, we must simply update its rotation
            setRotation(nearestOrbitalObject, this.referencePlaneRotation, this.elapsedSeconds);
        }

        // TRANSLATION COMPENSATION
        // We save the initial position of the nearest body and
        // compute what would be its next position if it were to move normally.
        // This gives us a translation vector that we can negate and apply to all other bodies.
        const initialPosition = nearestOrbitalObject.getTransform().position.clone();
        const nearestObjectParents = this.objectToParents.get(nearestOrbitalObject);
        if (nearestObjectParents === undefined) {
            throw new Error("Nearest object parents are not defined");
        }
        const newPosition = getOrbitalPosition(
            nearestOrbitalObject,
            nearestObjectParents,
            this.referencePlaneRotation,
            this.elapsedSeconds,
        );

        const nearestBodyDisplacement = newPosition.subtract(initialPosition);
        const negatedDisplacement = nearestBodyDisplacement.negate();
        for (const object of orbitalObjects) {
            if (object === nearestOrbitalObject) continue;

            // the body is translated so that the nearest body can stay in place
            translate(object.getTransform(), negatedDisplacement);
        }

        this.referencePosition.addInPlace(negatedDisplacement);

        // then, all other objects are updated normally
        for (const object of orbitalObjects) {
            if (object === nearestOrbitalObject) continue;

            const parents = this.objectToParents.get(object);
            if (parents === undefined) {
                throw new Error(`Parents of ${object.model.name} are not defined`);
            }

            setOrbitalPosition(object, parents, this.referencePlaneRotation, this.elapsedSeconds);
            setRotation(object, this.referencePlaneRotation, this.elapsedSeconds);
        }

        for (const systemTarget of this.systemTargets) {
            systemTarget.updatePosition(this.referencePlaneRotation, this.referencePosition);
        }

        controls.update(deltaSeconds);

        for (const object of celestialBodies) {
            object.asteroidField?.update(
                controls.getActiveCamera().globalPosition,
                this.assets.objects.asteroids,
                deltaSeconds,
            );
        }

        for (const object of this.getPlanetaryMassObjects()) {
            object.computeCulling(controls.getActiveCamera());
            if (
                object.type === OrbitalObjectType.TELLURIC_PLANET ||
                object.type === OrbitalObjectType.TELLURIC_SATELLITE
            ) {
                object.updateLOD(controls.getTransform().getAbsolutePosition(), chunkForge);
            }
        }

        const cameraWorldPosition = controls.getTransform().getAbsolutePosition();
        for (const orbitalFacility of orbitalFacilities) {
            const parents = this.objectToParents.get(orbitalFacility) ?? [];
            orbitalFacility.update(parents, cameraWorldPosition, deltaSeconds);
            orbitalFacility.computeCulling(controls.getActiveCamera());
        }

        // floating origin
        this.applyFloatingOrigin();

        this.updateShaders(deltaSeconds);
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateEverythingNow(displacement: Vector3): void {
        const orbitalObjects = this.getOrbitalObjects();
        for (const object of orbitalObjects) translate(object.getTransform(), displacement);
        this.referencePosition.addInPlace(displacement);
    }

    public applyFloatingOrigin() {
        const controls = this.scene.getActiveControls();
        if (controls.getTransform().getAbsolutePosition().length() > Settings.FLOATING_ORIGIN_THRESHOLD) {
            const displacementTranslation = controls.getTransform().getAbsolutePosition().negate();
            this.translateEverythingNow(displacementTranslation);
            if (controls.getTransform().parent === null) {
                translate(controls.getTransform(), displacementTranslation);
            }
        }
    }

    /**
     * Updates the material shaders of all the bodies in the system with the given delta time
     * @param deltaSeconds The time elapsed in seconds since the last update
     */
    public updateShaders(deltaSeconds: number) {
        const stellarObjects = this.getStellarObjects();
        const planetaryMassObjects = this.getPlanetaryMassObjects();

        for (const planet of planetaryMassObjects) {
            planet.updateMaterial(
                stellarObjects.map((object) => object.getLight()),
                deltaSeconds,
            );
        }

        for (const stellarObject of stellarObjects) {
            //FIXME: this needs to be refactored to be future proof when adding new stellar objects
            if (stellarObject instanceof Star) stellarObject.updateMaterial(deltaSeconds);
        }

        this.scene.activeCamera?.getViewMatrix(true);
    }

    addSystemTarget(
        targetCoordinates: StarSystemCoordinates,
        starSystemDatabase: StarSystemDatabase,
    ): SystemTarget | null {
        const currentSystemUniversePosition = wrapVector3(
            starSystemDatabase.getSystemGalacticPosition(this.model.coordinates),
        );
        const targetSystemUniversePosition = wrapVector3(
            starSystemDatabase.getSystemGalacticPosition(targetCoordinates),
        );

        const distance = lightYearsToMeters(
            Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition),
        );

        const direction = targetSystemUniversePosition.subtract(currentSystemUniversePosition).normalize();

        Vector3.TransformCoordinatesToRef(direction, this.referencePlaneRotation, direction);

        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(targetCoordinates);
        if (systemModel === null) {
            return null;
        }
        const placeholderTransform = new SystemTarget(systemModel, direction.scale(distance), this.scene);

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
        this.objectToParents.clear();

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
