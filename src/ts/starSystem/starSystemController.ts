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
import { Matrix } from "@babylonjs/core/Maths/math";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { UberScene } from "../uberCore/uberScene";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { translate } from "../uberCore/transforms/basicTransform";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { ChunkForge } from "../planets/telluricPlanet/terrain/chunks/chunkForge";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { SystemTarget } from "../utils/systemTarget";
import { StarFieldBox } from "./starFieldBox";
import { StarSystemModel } from "./starSystemModel";
import { Settings } from "../settings";
import { StarSystemCoordinates } from "../utils/coordinates/starSystemCoordinates";
import { StarSystemDatabase } from "./starSystemDatabase";
import {
    Anomaly,
    CelestialBody,
    OrbitalFacility,
    OrbitalObject,
    Planet,
    StellarObject
} from "../architecture/orbitalObject";
import { OrbitalObjectUtils } from "../architecture/orbitalObjectUtils";
import { OrbitalObjectId } from "../utils/coordinates/orbitalObjectId";
import { StarSystemLoader } from "./starSystemLoader";
import { DeepReadonly, NonEmptyArray } from "../utils/types";
import { RenderingAssets } from "../assets/renderingAssets";

export type PlanetarySystem = {
    readonly planets: Planet[];
    readonly satellites: TelluricPlanet[];
    readonly spaceStations: OrbitalFacility[];
};

export type SubStarSystem = {
    readonly stellarObjects: StellarObject[];
    readonly planetarySystems: PlanetarySystem[];
    readonly anomalies: Anomaly[];
    readonly spaceStations: OrbitalFacility[];
};

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
        scene: UberScene
    ) {
        this.scene = scene;
        this.starFieldBox = new StarFieldBox(assets.textures.environment.milkyWay, scene);
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
                    object.model.orbit.parentIds.includes(otherObject.model.id)
                )
            );
        });
    }

    public static async CreateAsync(
        model: DeepReadonly<StarSystemModel>,
        loader: StarSystemLoader,
        assets: RenderingAssets,
        scene: UberScene
    ): Promise<StarSystemController> {
        const result = await loader.load(model, assets, scene);
        return new StarSystemController(model, result, assets, scene);
    }

    public getMostInfluentialObject(position: Vector3): OrbitalObject {
        const orbitalObjects = this.getOrbitalObjects();
        if (orbitalObjects.length === 0) {
            throw new Error("There are no orbital objects in the solar system");
        }

        let bestRelativeDistance = Number.POSITIVE_INFINITY;
        let bestObject: OrbitalObject = orbitalObjects[0];
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

        if (orbitalObjects.length === 0) throw new Error("There are no orbital objects in the solar system");
        let nearest: OrbitalObject = orbitalObjects[0];
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
    public initPositions(
        nbWarmUpUpdates: number,
        chunkForge: ChunkForge,
        postProcessManager: PostProcessManager
    ): void {
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
            switch (object.type) {
                case OrbitalObjectType.STAR:
                    postProcessManager.addStar(object, [this.starFieldBox.mesh]);
                    break;
                case OrbitalObjectType.NEUTRON_STAR:
                    postProcessManager.addNeutronStar(object, [this.starFieldBox.mesh]);
                    break;
                case OrbitalObjectType.BLACK_HOLE:
                    postProcessManager.addBlackHole(object);
                    break;
                case OrbitalObjectType.TELLURIC_PLANET:
                    postProcessManager.addTelluricPlanet(object, stellarObjects);
                    break;
                case OrbitalObjectType.TELLURIC_SATELLITE:
                    postProcessManager.addTelluricPlanet(object, stellarObjects);
                    break;
                case OrbitalObjectType.GAS_PLANET:
                    postProcessManager.addGasPlanet(object, stellarObjects);
                    break;
                case OrbitalObjectType.MANDELBULB:
                    postProcessManager.addMandelbulb(
                        object.getTransform(),
                        object.getRadius(),
                        object.model,
                        stellarObjects.map((object) => object.getLight())
                    );
                    break;
                case OrbitalObjectType.JULIA_SET:
                    postProcessManager.addJuliaSet(
                        object.getTransform(),
                        object.getRadius(),
                        object.model,
                        stellarObjects.map((object) => object.getLight())
                    );
                    break;
                case OrbitalObjectType.MANDELBOX:
                    postProcessManager.addMandelbox(
                        object.getTransform(),
                        object.getRadius(),
                        object.model,
                        stellarObjects.map((object) => object.getLight())
                    );
                    break;
                case OrbitalObjectType.SIERPINSKI_PYRAMID:
                    postProcessManager.addSierpinskiPyramid(
                        object.getTransform(),
                        object.getRadius(),
                        object.model,
                        stellarObjects.map((object) => object.getLight())
                    );
                    break;
                case OrbitalObjectType.MENGER_SPONGE:
                    postProcessManager.addMengerSponge(
                        object.getTransform(),
                        object.getRadius(),
                        object.model,
                        stellarObjects.map((object) => object.getLight())
                    );
                    break;
                case OrbitalObjectType.DARK_KNIGHT:
                    break;
            }
        }

        postProcessManager.setCelestialBody(
            this.getNearestCelestialBody(this.scene.getActiveControls().getTransform().getAbsolutePosition())
        );
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
            controlsPosition
        );

        const shouldCompensateTranslation = true;

        // compensate rotation when close to the body
        let shouldCompensateRotation = distanceOfNearestToControls < nearestOrbitalObject.getBoundingRadius() * 3;
        if (nearestOrbitalObject === nearestCelestialBody && ringUniforms !== null) {
            // or in the vicinity of the rings
            shouldCompensateRotation =
                shouldCompensateRotation ||
                distanceOfNearestToControls < ringUniforms.model.ringEnd * nearestOrbitalObject.getBoundingRadius();
        }
        // never compensate the rotation of a black hole
        shouldCompensateRotation = shouldCompensateRotation && !(nearestOrbitalObject instanceof BlackHole);

        // ROTATION COMPENSATION
        // If we have to compensate the rotation of the nearest body, we must rotate the reference plane instead
        if (shouldCompensateRotation) {
            const dThetaNearest = OrbitalObjectUtils.GetRotationAngle(nearestOrbitalObject, deltaSeconds);

            const nearestObjectRotationAxis = nearestOrbitalObject.getTransform().up.clone();
            Vector3.TransformNormalToRef(
                nearestObjectRotationAxis,
                this.referencePlaneRotation.transpose(),
                nearestObjectRotationAxis
            );

            const rotation = Matrix.RotationAxis(nearestObjectRotationAxis, -dThetaNearest);

            // update the reference plane rotation
            rotation.multiplyToRef(this.referencePlaneRotation, this.referencePlaneRotation);

            // the starfield is rotated to give the impression the nearest body is rotating, which is only an illusion
            this.referencePlaneRotation.transposeToRef(this.starFieldBox.getRotationMatrix());
        } else {
            // if we don't compensate the rotation of the nearest body, we must simply update its rotation
            OrbitalObjectUtils.SetRotation(nearestOrbitalObject, this.referencePlaneRotation, this.elapsedSeconds);
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
        const newPosition = OrbitalObjectUtils.GetOrbitalPosition(
            nearestOrbitalObject,
            nearestObjectParents,
            this.referencePlaneRotation,
            this.elapsedSeconds
        );

        const nearestBodyDisplacement = newPosition.subtract(initialPosition);
        if (shouldCompensateTranslation) {
            const negatedDisplacement = nearestBodyDisplacement.negate();
            for (const object of orbitalObjects) {
                if (object === nearestOrbitalObject) continue;

                // the body is translated so that the nearest body can stay in place
                translate(object.getTransform(), negatedDisplacement);
            }

            this.referencePosition.addInPlace(negatedDisplacement);
        } else {
            // if we don't compensate the translation of the nearest body, we must simply update its position
            translate(nearestOrbitalObject.getTransform(), nearestBodyDisplacement);
        }

        // then, all other objects are updated normally
        for (const object of orbitalObjects) {
            if (object === nearestOrbitalObject) continue;

            const parents = this.objectToParents.get(object);
            if (parents === undefined) {
                throw new Error(`Parents of ${object.model.name} are not defined`);
            }

            OrbitalObjectUtils.SetOrbitalPosition(object, parents, this.referencePlaneRotation, this.elapsedSeconds);
            OrbitalObjectUtils.SetRotation(object, this.referencePlaneRotation, this.elapsedSeconds);
        }

        for (const systemTarget of this.systemTargets) {
            systemTarget.updatePosition(this.referencePlaneRotation, this.referencePosition);
        }

        controls.update(deltaSeconds);

        for (const object of celestialBodies) {
            object.asteroidField?.update(controls.getActiveCamera().globalPosition, this.assets.objects, deltaSeconds);
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
            orbitalFacility.update(this.objectToParents.get(orbitalFacility) ?? [], cameraWorldPosition, deltaSeconds);
            orbitalFacility.computeCulling(controls.getActiveCamera());
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
     * Updates the shaders of all the bodies in the system with the given delta time
     * @param deltaSeconds The time elapsed in seconds since the last update
     * @param postProcessManager
     */
    public updateShaders(deltaSeconds: number, postProcessManager: PostProcessManager) {
        const nearestBody = this.getNearestCelestialBody(
            this.scene.getActiveControls().getTransform().getAbsolutePosition()
        );

        const stellarObjects = this.getStellarObjects();
        const planetaryMassObjects = this.getPlanetaryMassObjects();

        for (const planet of planetaryMassObjects) {
            planet.updateMaterial(
                stellarObjects.map((object) => object.getLight()),
                deltaSeconds
            );
        }

        for (const stellarObject of stellarObjects) {
            //FIXME: this needs to be refactored to be future proof when adding new stellar objects
            if (stellarObject instanceof Star) stellarObject.updateMaterial(deltaSeconds);
        }

        this.scene.activeCamera?.getViewMatrix(true);

        postProcessManager.setCelestialBody(nearestBody);
        postProcessManager.update(deltaSeconds);
    }

    addSystemTarget(targetCoordinates: StarSystemCoordinates, starSystemDatabase: StarSystemDatabase): SystemTarget {
        const currentSystemUniversePosition = starSystemDatabase.getSystemGalacticPosition(this.model.coordinates);
        const targetSystemUniversePosition = starSystemDatabase.getSystemGalacticPosition(targetCoordinates);

        const distance =
            Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition) * Settings.LIGHT_YEAR;

        const direction = targetSystemUniversePosition
            .subtract(currentSystemUniversePosition)
            .scaleInPlace(Settings.LIGHT_YEAR / distance);
        Vector3.TransformCoordinatesToRef(direction, this.starFieldBox.getRotationMatrix(), direction);

        const systemModel = starSystemDatabase.getSystemModelFromCoordinates(targetCoordinates);
        if (systemModel === null) {
            throw new Error(`System model for coordinates ${targetCoordinates} is null`);
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

        this.orbitalFacilities.forEach((facility) => facility.dispose());
        this.anomalies.forEach((anomaly) => anomaly.dispose());
        this.satellites.forEach((satellite) => satellite.dispose(pools.ringsLut, pools.cloudsLut));
        this.planets.forEach((planet) => planet.dispose(pools.ringsLut, pools.cloudsLut));
        this.stellarObjects.forEach((stellarObject) => stellarObject.dispose(pools.ringsLut));

        this.systemTargets.forEach((target) => target.dispose());
        this.systemTargets.length = 0;

        this.starFieldBox.dispose();
    }
}
