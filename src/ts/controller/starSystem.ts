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
import { NeutronStar } from "../view/bodies/stellarObjects/neutronStar";
import { StellarObject } from "../view/bodies/stellarObjects/stellarObject";
import { SpaceStation } from "../view/spaceStation";
import { AbstractObject } from "../view/bodies/abstractObject";
import { rotateAround, setUpVector, translate } from "./uberCore/transforms/basicTransform";
import { Mandelbulb } from "../view/bodies/planemos/mandelbulb";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../view/postProcesses/postProcessTypes";
import { getTransformationQuaternion } from "../utils/algebra";

export class StarSystem {
    readonly scene: UberScene;

    readonly postProcessManager: PostProcessManager;

    private readonly universeRotation: Quaternion = Quaternion.Identity();

    private readonly orbitalObjects: AbstractObject[] = [];

    private readonly spaceStations: SpaceStation[] = [];

    readonly celestialBodies: AbstractBody[] = [];

    /**
     * The list of all stellar objects in the system (stars, black holes, pulsars)
     */
    readonly stellarObjects: StellarObject[] = [];

    /**
     * The list of all planemos in the system (planets and satellites)
     */
    readonly planemosWithMaterial: PlanemoMaterial[] = [];

    /**
     * The list of all planets in the system (telluric and gas)
     */
    readonly planets: Planemo[] = [];

    /**
     * The list of all telluric planets in the system
     */
    readonly telluricPlanemos: TelluricPlanemo[] = [];

    /**
     * The list of all gas planets in the system
     */
    readonly gasPlanets: GasPlanet[] = [];

    /**
     * The list of all mandelbulbs in the system
     */
    readonly mandelbulbs: Mandelbulb[] = [];

    /**
     * The model of the star system that describes it and generates the randomness
     */
    readonly model: StarSystemModel;

    private nearestOrbitalObject: AbstractObject | null = null;

    private closestToScreenCenterOrbitalObject: AbstractObject | null = null;

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
        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
        this.planemosWithMaterial.push(planet);
        this.planets.push(planet);
        this.telluricPlanemos.push(planet);
        return planet;
    }

    /**
     * Adds a gas planet to the system and returns it
     * @param planet The planet to add to the system
     */
    public addGasPlanet(planet: GasPlanet): GasPlanet {
        this.orbitalObjects.push(planet);
        this.celestialBodies.push(planet);
        this.planemosWithMaterial.push(planet);
        this.planets.push(planet);
        this.gasPlanets.push(planet);
        return planet;
    }

    /**
     * Adds a satellite to the system and returns it
     * @param satellite The satellite to add to the system
     * @returns The satellite added to the system
     */
    public addTelluricSatellite(satellite: TelluricPlanemo): TelluricPlanemo {
        this.orbitalObjects.push(satellite);
        this.celestialBodies.push(satellite);
        this.planemosWithMaterial.push(satellite);
        this.telluricPlanemos.push(satellite);
        return satellite;
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
    }

    /**
     * Returns the list of all celestial bodies managed by the star system
     */
    public getBodies(): AbstractBody[] {
        return this.celestialBodies;
    }

    public getObjects(): AbstractObject[] {
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
            const distance = body.getTransform().getAbsolutePosition().subtract(position).length() - body.model.radius;
            if (nearest === null || distance < smallerDistance) {
                nearest = body;
                smallerDistance = distance;
            }
        }

        smallerDistance = -1;
        for (const spacestation of this.spaceStations) {
            const distance = spacestation.getTransform().getAbsolutePosition().subtract(position).length() - spacestation.getBoundingRadius() * 50;
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
                this.scene.getActiveUberCamera().viewport
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

    public getClosestToScreenCenterOrbitalObject(): AbstractObject | null {
        return this.closestToScreenCenterOrbitalObject;
    }

    /**
     * Returns the nearest orbital object to the origin
     */
    public getNearestOrbitalObject(): AbstractObject {
        const nearest = this.nearestOrbitalObject;
        if (nearest === null) throw new Error("There are no bodies in the solar system");
        return nearest;
    }

    /**
     * Returns the nearest body to the given position
     */
    public getNearestCelestialBody(position: Vector3): AbstractBody {
        if (this.celestialBodies.length === 0) throw new Error("There are no bodies or spacestation in the solar system");
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

    /**
     * Inits the post processes and moves the system forward in time to the current time (it is additive)
     */
    public init(nbWarmUpUpdates = 100): void {
        this.initPostProcesses();

        for (const object of this.orbitalObjects) {
            const displacement = new Vector3(object.model.orbit.radius, 0, 0);
            const quaternion = getTransformationQuaternion(Vector3.Up(), object.model.orbit.normalToPlane);
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
        this.postProcessManager.addStarField(this.stellarObjects, this.celestialBodies, this.universeRotation);
        for (const object of this.orbitalObjects) {
            for (const postProcess of object.postProcesses) {
                switch (postProcess) {
                    case PostProcessType.RING:
                        if (!(object instanceof AbstractBody)) throw new Error("Rings post process can only be added to bodies. Source:" + object.name);
                        this.postProcessManager.addRings(object, this.stellarObjects);
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
                        this.postProcessManager.addBlackHole(object as BlackHole, this.universeRotation);
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
        this.postProcessManager.setBody(this.getNearestCelestialBody(this.scene.getActiveUberCamera().position));
    }

    /**
     * Updates the system and all its bodies forward in time by the given delta time
     * @param deltaTime The time elapsed since the last update
     */
    public update(deltaTime: number): void {
        const controller = this.scene.getActiveController();
        this.computeNearestOrbitalObject(controller.getActiveCamera().getAbsolutePosition());
        this.computeClosestToScreenCenterOrbitalObject();
        const nearestBody = this.getNearestOrbitalObject();

        const distanceOfNearestToCamera = Vector3.Distance(nearestBody.getTransform().getAbsolutePosition(), controller.getActiveCamera().getAbsolutePosition());
        const shouldCompensateTranslation = distanceOfNearestToCamera < nearestBody.getBoundingRadius() * (nearestBody instanceof SpaceStation ? 80 : 10);
        const shouldCompensateRotation = distanceOfNearestToCamera < nearestBody.getBoundingRadius() * 4;

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
            this.universeRotation.copyFrom(starfieldAdditionalRotation.multiply(this.universeRotation));
        }

        // finally, all other objects are updated normally
        for (const object of this.orbitalObjects) {
            if (object === nearestBody) continue;

            object.updateInternalClock(deltaTime);
            object.updateOrbitalPosition(deltaTime);
            object.updateRotation(deltaTime);
        }

        controller.update(deltaTime);

        for (const body of this.telluricPlanemos) {
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

    /**
     * Updates the shaders of all the bodies in the system with the given delta time
     * @param deltaTime The time elapsed in seconds since the last update
     */
    public updateShaders(deltaTime: number) {
        const controller = this.scene.getActiveController();
        const nearestBody = this.getNearestCelestialBody(this.scene.getActiveUberCamera().position);

        for (const planet of this.planemosWithMaterial) {
            planet.updateMaterial(controller, this.stellarObjects, deltaTime);
        }

        for (const stellarObject of this.stellarObjects) {
            if (stellarObject instanceof Star) stellarObject.updateMaterial();
        }

        this.postProcessManager.setBody(nearestBody);
        this.postProcessManager.update(deltaTime);
    }

    /**
     * Disposes all the bodies in the system
     */
    public dispose() {
        this.postProcessManager.dispose();
        for (const spacestation of this.spaceStations) spacestation.dispose();
        for (const body of this.celestialBodies) body.dispose();
    }
}
