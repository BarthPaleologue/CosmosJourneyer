//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { getTransformationQuaternion } from "../utils/algebra";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { UberScene } from "../uberCore/uberScene";
import { SpaceStation } from "../spacestation/spaceStation";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { StarSystemModel } from "./starSystemModel";
import { rotateAround, translate } from "../uberCore/transforms/basicTransform";
import { Star } from "../stellarObjects/star/star";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { SystemSeed } from "../utils/systemSeed";
import { ChunkForge } from "../planets/telluricPlanet/terrain/chunks/chunkForge";
import { OrbitalObject } from "../architecture/orbitalObject";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";
import { Planet } from "../architecture/planet";
import { SystemTarget } from "../utils/systemTarget";

export class StarSystemController {
    readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    readonly universeRotation: Quaternion = Quaternion.Identity();

    private readonly orbitalObjects: OrbitalObject[] = [];

    private readonly spaceStations: SpaceStation[] = [];

    readonly celestialBodies: CelestialBody[] = [];

    /**
     * The list of all stellar objects in the system (stars, black holes, pulsars)
     */
    readonly stellarObjects: StellarObject[] = [];

    /**
     * The list of all planets in the system (telluric and gas)
     */
    readonly planets: Planet[] = [];

    /**
     * The list of all telluric planets in the system
     */
    readonly telluricPlanets: TelluricPlanet[] = [];

    /**
     * The list of all gas planets in the system
     */
    readonly gasPlanets: GasPlanet[] = [];

    /**
     * The list of all mandelbulbs in the system
     */
    readonly mandelbulbs: Mandelbulb[] = [];

    /**
     * The list of all system targets in the system
     */
    private systemTargets: SystemTarget[] = [];

    /**
     * The model of the star system that describes it and generates the randomness
     */
    readonly model: StarSystemModel;

    private nearestOrbitalObject: OrbitalObject | null = null;

    private closestToScreenCenterOrbitalObject: OrbitalObject | null = null;

    constructor(model: StarSystemModel | SystemSeed, scene: UberScene) {
        this.scene = scene;
        this.postProcessManager = new PostProcessManager(this.scene);

        this.model = model instanceof StarSystemModel ? model : new StarSystemModel(model);
    }

    /**
     * Adds a telluric planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addTelluricPlanet(planet: TelluricPlanet): TelluricPlanet {
        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
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
        this.planets.push(planet);
        this.gasPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a Mandelbulb to the system and returns it
     * @param mandelbulb The mandelbulb to add to the system
     * @returns The mandelbulb added to the system
     */
    public addMandelbulb(mandelbulb: Mandelbulb): Mandelbulb {
        this.orbitalObjects.push(mandelbulb);
        this.celestialBodies.push(mandelbulb);
        this.mandelbulbs.push(mandelbulb);
        return mandelbulb;
    }

    /**
     * Adds a star or a blackhole to the system and returns it
     * @param stellarObject The star added to the system
     * @returns The star added to the system
     */
    public addStellarObject(stellarObject: StellarObject): StellarObject {
        this.orbitalObjects.push(stellarObject);
        this.celestialBodies.push(stellarObject);
        this.stellarObjects.push(stellarObject);
        return stellarObject;
    }

    /**
     * Adds a spacestation to the system and returns it
     * @param spaceStation The spacestation added to the system
     * @returns The spacestation added to the system
     */
    public addSpaceStation(spaceStation: SpaceStation): SpaceStation {
        this.orbitalObjects.push(spaceStation);
        this.spaceStations.push(spaceStation);
        return spaceStation;
    }

    /**
     * Translates all celestial bodies and spacestations in the system by the given displacement
     * @param displacement The displacement applied to all bodies
     */
    public translateEverythingNow(displacement: Vector3): void {
        for (const object of this.orbitalObjects) translate(object.getTransform(), displacement);
        this.systemTargets.forEach((target) => translate(target.getTransform(), displacement));
    }

    /**
     * Returns the list of all celestial bodies managed by the star system
     */
    public getBodies(): CelestialBody[] {
        return this.celestialBodies;
    }

    public getOrbitalObjects(): OrbitalObject[] {
        const objects = [];
        for (const body of this.celestialBodies) objects.push(body);
        for (const spacestation of this.spaceStations) objects.push(spacestation);
        return objects;
    }

    public computeNearestOrbitalObject(position: Vector3): void {
        if (this.celestialBodies.length + this.spaceStations.length === 0) throw new Error("There are no bodies or spacestation in the solar system");
        let nearest = null;
        let smallerDistance = -1;
        for (const body of this.celestialBodies) {
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.getRadius();
            if (nearest === null || distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        smallerDistance = -1;
        for (const spacestation of this.spaceStations) {
            const distance = spacestation.getTransform().getAbsolutePosition().subtract(position).length() - spacestation.getBoundingRadius() * 100;
            if (distance < smallerDistance && distance < 0) {
                nearest = spacestation;
                smallerDistance = distance;
            }
        }
        this.nearestOrbitalObject = nearest;
    }

    public computeClosestToScreenCenterOrbitalObject() {
        let nearest = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        for (const object of this.orbitalObjects) {
            const screenCoordinates = Vector3.Project(
                object.getTransform().getAbsolutePosition(),
                Matrix.IdentityReadOnly,
                this.scene.getTransformMatrix(),
                this.scene.getActiveCamera().viewport
            );

            if (screenCoordinates.z < 0) continue;

            const distance = screenCoordinates.subtract(new Vector3(0.5, 0.5, 0)).length();

            if (distance < closestDistance) {
                closestDistance = distance;
                nearest = object;
            }
        }

        this.closestToScreenCenterOrbitalObject = nearest;
    }

    public getClosestToScreenCenterOrbitalObject(): OrbitalObject | null {
        return this.closestToScreenCenterOrbitalObject;
    }

    /**
     * Returns the nearest orbital object to the origin
     */
    public getNearestOrbitalObject(): OrbitalObject {
        const nearest = this.nearestOrbitalObject;
        if (nearest === null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    /**
     * Returns the nearest body to the given position
     */
    public getNearestCelestialBody(position: Vector3): CelestialBody {
        if (this.celestialBodies.length === 0) throw new Error("There are no bodies or spacestation in the solar system");
        let nearest = null;
        let smallerDistance = -1;
        for (const body of this.celestialBodies) {
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
        for (const object of this.orbitalObjects) {
            const orbit = object.getOrbitProperties();
            const displacement = new Vector3(orbit.radius, 0, 0);
            const quaternion = getTransformationQuaternion(Vector3.Up(), orbit.normalToPlane);
            displacement.applyRotationQuaternionInPlace(quaternion);
            if (object.parent !== null) {
                translate(object.getTransform(), object.parent.getTransform().getAbsolutePosition());
            }
            translate(object.getTransform(), displacement);
        }

        this.update(Date.now() / 1000, chunkForge);
        for (let i = 0; i < nbWarmUpUpdates; i++) this.update(1, chunkForge);
    }

    /**
     * Inits the post processes of all the bodies in the system
     * This method cannot be awaited as its completion depends on the execution of BabylonJS that happens afterward.
     */
    public async initPostProcesses() {
        const promises: Promise<void>[] = [];

        this.postProcessManager.addStarField(this.stellarObjects, this.celestialBodies, this.universeRotation);
        for (const object of this.celestialBodies) {
            for (const postProcess of object.postProcesses) {
                switch (postProcess) {
                    case PostProcessType.RING:
                        promises.push(this.postProcessManager.addRings(object, this.stellarObjects));
                        break;
                    case PostProcessType.ATMOSPHERE:
                        if (!(object instanceof GasPlanet) && !(object instanceof TelluricPlanet))
                            throw new Error("Atmosphere post process can only be added to gas or telluric planets. Source:" + object.name);
                        this.postProcessManager.addAtmosphere(object as GasPlanet | TelluricPlanet, this.stellarObjects);
                        break;
                    case PostProcessType.CLOUDS:
                        if (!(object instanceof TelluricPlanet)) throw new Error("Clouds post process can only be added to telluric planets. Source:" + object.name);
                        promises.push(this.postProcessManager.addClouds(object as TelluricPlanet, this.stellarObjects));
                        break;
                    case PostProcessType.OCEAN:
                        if (!(object instanceof TelluricPlanet)) throw new Error("Ocean post process can only be added to telluric planets. Source:" + object.name);
                        this.postProcessManager.addOcean(object as TelluricPlanet, this.stellarObjects);
                        break;
                    case PostProcessType.VOLUMETRIC_LIGHT:
                        if (!(object instanceof Star) && !(object instanceof NeutronStar))
                            throw new Error("Volumetric light post process can only be added to stars and neutron stars. Source:" + object.name);
                        this.postProcessManager.addVolumetricLight(object);
                        break;
                    case PostProcessType.MANDELBULB:
                        if (!(object instanceof Mandelbulb)) throw new Error("Mandelbulb post process can only be added to mandelbulbs. Source:" + object.name);
                        this.postProcessManager.addMandelbulb(object as Mandelbulb, this.stellarObjects);
                        break;
                    case PostProcessType.BLACK_HOLE:
                        if (!(object instanceof BlackHole)) throw new Error("Black hole post process can only be added to black holes. Source:" + object.name);
                        this.postProcessManager.addBlackHole(object as BlackHole, this.universeRotation);
                        break;
                    case PostProcessType.MATTER_JETS:
                        if (!(object instanceof NeutronStar)) throw new Error("Matter jets post process can only be added to neutron stars. Source:" + object.name);
                        this.postProcessManager.addMatterJet(object as NeutronStar);
                        break;
                    case PostProcessType.SHADOW:
                        promises.push(this.postProcessManager.addShadowCaster(object, this.stellarObjects));
                        break;
                    case PostProcessType.LENS_FLARE:
                        this.postProcessManager.addLensFlare(object as StellarObject);
                        break;
                }
            }
        }

        return Promise.all(promises).then(() => {
            this.postProcessManager.setBody(this.getNearestCelestialBody(this.scene.getActiveCamera().globalPosition));
            this.postProcessManager.init();
        });
    }

    /**
     * Updates the system and all its orbital objects forward in time by the given delta time.
     * The nearest object is kept in place and the other objects are updated accordingly.
     * @param deltaTime The time elapsed since the last update
     * @param chunkForge The chunk forge used to update the LOD of the telluric planets
     */
    public update(deltaTime: number, chunkForge: ChunkForge): void {
        const controller = this.scene.getActiveController();
        this.computeNearestOrbitalObject(controller.getActiveCamera().globalPosition);
        this.computeClosestToScreenCenterOrbitalObject();

        // The nearest body might have to be treated separatly
        // The first step is to find the nearest body
        const nearestBody = this.getNearestOrbitalObject();

        // Depending on the distance to the nearest body, we might have to compensate its translation and/or rotation
        // If we are very close, we want both translation and rotation to be compensated, so that the body appears to be fixed
        // When we are a bit further, we only need to compensate the translation as it would be unnatural not to see the body rotating
        const distanceOfNearestToControls = Vector3.Distance(nearestBody.getTransform().getAbsolutePosition(), controller.getTransform().getAbsolutePosition());
        const shouldCompensateTranslation = distanceOfNearestToControls < nearestBody.getBoundingRadius() * (nearestBody instanceof SpaceStation ? 80 : 10);
        const shouldCompensateRotation = !(nearestBody instanceof SpaceStation) && distanceOfNearestToControls < nearestBody.getBoundingRadius() * 3;

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
            const dthetaNearest = OrbitalObject.GetRotationAngle(nearestBody, deltaTime);

            for (const object of this.orbitalObjects) {
                const orbit = object.getOrbitProperties();

                // the normal to the orbit planes must be rotated as well (even the one of the nearest body)
                const rotation = Quaternion.RotationAxis(nearestBody.getRotationAxis(), -dthetaNearest);
                orbit.normalToPlane.applyRotationQuaternionInPlace(rotation);

                if (object === nearestBody) continue;

                // All other bodies must revolve around it for consistency (finally we can say the sun revolves around the earth!)
                rotateAround(object.getTransform(), nearestBody.getTransform().getAbsolutePosition(), nearestBody.getRotationAxis(), -dthetaNearest);
            }

            this.systemTargets.forEach((target) => {
                rotateAround(target.getTransform(), nearestBody.getTransform().getAbsolutePosition(), nearestBody.getRotationAxis(), -dthetaNearest);
            });

            // the starfield is rotated to give the impression the nearest body is rotating, which is only an illusion
            const starfieldAdditionalRotation = Quaternion.RotationAxis(nearestBody.getRotationAxis(), dthetaNearest);
            this.universeRotation.copyFrom(starfieldAdditionalRotation.multiply(this.universeRotation));
        } else {
            // if we don't compensate the rotation of the nearest body, we must simply update its rotation
            OrbitalObject.UpdateRotation(nearestBody, deltaTime);
        }

        // TRANSLATION COMPENSATION
        // Compensating the translation is much easier in comparison. We save the initial position of the nearest body and
        // compute what would be its next position if it were to move normally.
        // This gives us a translation vector that we can negate and apply to all other bodies.
        const initialPosition = nearestBody.getTransform().getAbsolutePosition().clone();
        const newPosition = OrbitalObject.GetNextOrbitalPosition(nearestBody, deltaTime);
        const nearestBodyDisplacement = newPosition.subtract(initialPosition);
        if (shouldCompensateTranslation) {
            const negatedDisplacement = nearestBodyDisplacement.negate();
            for (const object of this.orbitalObjects) {
                if (object === nearestBody) continue;

                // the body is translated so that the nearest body can stay in place
                translate(object.getTransform(), negatedDisplacement);
            }

            this.systemTargets.forEach((target) => {
                translate(target.getTransform(), negatedDisplacement);
            });
        } else {
            // if we don't compensate the translation of the nearest body, we must simply update its position
            translate(nearestBody.getTransform(), nearestBodyDisplacement);
        }

        // finally, all other objects are updated normally
        for (const object of this.orbitalObjects) {
            if (object === nearestBody) continue;

            OrbitalObject.UpdateOrbitalPosition(object, deltaTime);
            OrbitalObject.UpdateRotation(object, deltaTime);
        }

        controller.update(deltaTime);

        for (const body of this.telluricPlanets) {
            // Meshes with LOD are updated (surface quadtrees)
            body.updateLOD(controller.getTransform().getAbsolutePosition(), chunkForge);
        }

        for (const object of this.telluricPlanets) {
            object.computeCulling(controller.getActiveCamera());
        }

        for (const object of this.gasPlanets) {
            object.computeCulling(controller.getActiveCamera());
        }

        for (const object of this.spaceStations) {
            object.computeCulling(controller.getActiveCamera());
        }

        // floating origin
        this.applyFloatingOrigin();

        this.updateShaders(deltaTime);
    }

    public applyFloatingOrigin() {
        const controller = this.scene.getActiveController();
        if (controller.getActiveCamera().globalPosition.length() > 500) {
            const displacementTranslation = controller.getTransform().getAbsolutePosition().negate();
            this.translateEverythingNow(displacementTranslation);
            translate(controller.getTransform(), displacementTranslation);
        }
    }

    /**
     * Updates the shaders of all the bodies in the system with the given delta time
     * @param deltaTime The time elapsed in seconds since the last update
     */
    public updateShaders(deltaTime: number) {
        const controller = this.scene.getActiveController();
        const nearestBody = this.getNearestCelestialBody(this.scene.getActiveCamera().globalPosition);

        for (const planet of this.planets) {
            planet.updateMaterial(controller.getActiveCamera(), this.stellarObjects, deltaTime);
        }

        for (const stellarObject of this.stellarObjects) {
            if (stellarObject instanceof Star) stellarObject.updateMaterial(deltaTime);
        }

        this.postProcessManager.setBody(nearestBody);
        this.postProcessManager.update(deltaTime);
    }

    addSystemTarget(seed: SystemSeed, systemDirection: Vector3, distance: number): SystemTarget {
        const placeholderTransform = new SystemTarget(seed, this.scene);
        placeholderTransform.getTransform().position.copyFrom(systemDirection.scale(distance));

        this.systemTargets.forEach((target) => {
            target.dispose();
        });
        this.systemTargets = [placeholderTransform];

        return placeholderTransform;
    }

    /**
     * Disposes all the bodies in the system
     */
    public dispose() {
        this.postProcessManager.dispose();
        for (const object of this.orbitalObjects) object.dispose();
        this.systemTargets.forEach((target) => target.dispose());
    }
}
