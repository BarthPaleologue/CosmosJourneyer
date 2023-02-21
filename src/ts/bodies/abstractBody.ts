import { Vector3 } from "@babylonjs/core";
import { BodyType } from "./interfaces";
import { AbstractController } from "../uberCore/abstractController";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { BodyDescriptor } from "../descriptors/interfaces";
import { computeBarycenter, computePointOnOrbit } from "../orbits/kepler";

/**
 * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
 * @param controller the controller to check
 * @param body the body to check whereas the player is orbiting
 * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
 */
export function isOrbiting(controller: AbstractController, body: AbstractBody, orbitLimitFactor = 2.5): boolean {
    return body.transform.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * body.getRadius()) ** 2;
}

export abstract class AbstractBody implements IOrbitalBody {
    abstract readonly bodyType: BodyType;

    readonly transform: BasicTransform;
    abstract postProcesses: BodyPostProcesses;

    //TODO: make an universal clock ?? or not it could be funny
    private internalTime = 0;

    readonly name: string;

    abstract readonly descriptor: BodyDescriptor;

    abstract readonly radius: number;

    readonly parentBodies: AbstractBody[];

    depth: number;

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param parentBodies the parent bodies of this body
     */
    protected constructor(name: string, parentBodies: AbstractBody[]) {
        this.name = name;

        this.parentBodies = parentBodies;

        this.transform = new BasicTransform(name);

        let minDepth = -1;
        for (const parentBody of parentBodies) {
            if (minDepth == -1) minDepth = parentBody.depth;
            else minDepth = Math.min(minDepth, parentBody.depth);
        }
        if (minDepth == -1) this.depth = 0;
        else this.depth = minDepth + 1;
    }

    /**
     * Returns the radius of the celestial body
     */
    public getRadius(): number {
        return this.radius;
    }

    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    public getApparentRadius(): number {
        return this.getRadius();
    }

    /**
     * Returns the diameter of the celestial body
     */
    public getDiameter(): number {
        return 2 * this.getRadius();
    }

    /**
     * Returns the axis of rotation of the body
     */
    public getRotationAxis(): Vector3 {
        return this.transform.node.up;
    }

    public getInternalTime(): number {
        return this.internalTime;
    }

    public updateClock(deltaTime: number): void {
        this.internalTime += deltaTime;
    }

    public updateOrbitalPosition(controller: AbstractController): void {
        if (this.descriptor.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.descriptor.orbitalProperties.orientationQuaternion = orientationQuaternion;

            //TODO: orient the planet accurately

            const initialPosition = this.transform.getAbsolutePosition().clone();
            const newPosition = computePointOnOrbit(barycenter, this.descriptor.orbitalProperties, this.internalTime);

            if (isOrbiting(controller, this, 50 / (this.depth + 1) ** 3)) controller.transform.translate(newPosition.subtract(initialPosition));
            this.transform.translate(newPosition.subtract(initialPosition));
        }
    }

    public updateRotation(controller: AbstractController, deltaTime: number): void {
        if (this.descriptor.physicalProperties.rotationPeriod > 0) {
            const dtheta = (2 * Math.PI * deltaTime) / this.descriptor.physicalProperties.rotationPeriod;

            if (isOrbiting(controller, this)) controller.transform.rotateAround(this.transform.getAbsolutePosition(), this.getRotationAxis(), -dtheta);
            this.transform.rotate(this.getRotationAxis(), -dtheta);
        }
    }

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param deltaTime the time step to update for
     */
    public updateTransform(player: AbstractController, deltaTime: number): void {
        this.updateClock(deltaTime);
        this.updateOrbitalPosition(player);
        this.updateRotation(player, deltaTime);
    }
}
