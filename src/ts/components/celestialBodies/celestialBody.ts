import { Vector3, Quaternion } from "@babylonjs/core";
import {Algebra} from "../utils/algebra";
import {BodyPhysicalProperties, CelestialBodyType, Transformable} from "./interfaces";
import {PlayerController} from "../player/playerController";

export abstract class CelestialBody implements Transformable {
    protected abstract bodyType: CelestialBodyType;

    abstract physicalProperties: BodyPhysicalProperties;

    readonly _name: string;

    protected constructor(name: string) {
        this._name = name;
    }

    /**
     * Returns the name of the body
     */
    public getName(): string {
        return this._name;
    }

    public abstract setAbsolutePosition(newPosition: Vector3): void;
    public abstract getAbsolutePosition(): Vector3;
    public abstract getRotationQuaternion(): Quaternion;

    /**
     * Returns the body type of the body (useful for casts)
     */
    public getBodyType(): CelestialBodyType {
        return this.bodyType;
    }

    /**
     * Returns the radius of the celestial body
     */
    public abstract getRadius(): number;

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param lightPosition the position of the main light source
     * @param deltaTime the time step to update for
     */
    public update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        let dtheta = deltaTime / this.physicalProperties.rotationPeriod;

        if(player.isOrbiting && player.nearestBody?.getName() == this.getName()) {
            player.rotateAround(this.getAbsolutePosition(), this.physicalProperties.rotationAxis, dtheta);
        }
    }

    public getOriginBodySpaceSamplePosition(): Vector3 {
        let position = this.getAbsolutePosition().scale(-1); // position du joueur / au centre de la planète

        // negates planet rotation using inverse quaternion to go back to original sample point
        Algebra.applyQuaternionInPlace(Quaternion.Inverse(this.getRotationQuaternion()), position);

        return position;
    }

    public abstract translate(displacement: Vector3): void;

    public abstract rotateAround(pivot: Vector3, axis: Vector3, amount: number): void;

    public abstract rotate(axis: Vector3, amount: number): void;
}
