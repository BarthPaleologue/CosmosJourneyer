import {Vector3, Quaternion, Space, Matrix} from "@babylonjs/core";
import {Algebra} from "../utils/algebra";
import {
    BodyPhysicalProperties,
    BodyPostProcesses,
    CelestialBodyType,
    PlanetPostProcesses,
    Transformable
} from "./interfaces";
import {PlayerController} from "../player/playerController";
import {StarSystemManager} from "./starSystemManager";

export abstract class CelestialBody implements Transformable {
    protected abstract bodyType: CelestialBodyType;

    abstract physicalProperties: BodyPhysicalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly _starSystemManager: StarSystemManager;

    readonly _name: string;

    protected constructor(name: string, starSystemManager: StarSystemManager) {
        this._name = name;
        this._starSystemManager = starSystemManager;
        starSystemManager.addBody(this);
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
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param lightPosition the position of the main light source
     * @param deltaTime the time step to update for
     */
    public update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        let dtheta = deltaTime / this.physicalProperties.rotationPeriod;

        if (player.isOrbiting() && player.nearestBody?.getName() == this.getName()) {
            player.rotateAround(this.getAbsolutePosition(), this.physicalProperties.rotationAxis, -dtheta);
        }
        this.rotate(this.physicalProperties.rotationAxis, -dtheta);
    }

    public getOriginBodySpaceSamplePosition(): Vector3 {
        let position = this.getAbsolutePosition().scale(-1); // position du joueur / au centre de la planète

        // negates planet rotation using inverse quaternion to go back to original sample point
        Algebra.applyQuaternionInPlace(Quaternion.Inverse(this.getRotationQuaternion()), position);

        return position;
    }

    public translate(displacement: Vector3): void {
        this.setAbsolutePosition(this.getAbsolutePosition().add(displacement));
    }

    public abstract rotateAround(pivot: Vector3, axis: Vector3, amount: number): void;

    public rotate(axis: Vector3, amount: number) {
        this.physicalProperties.rotationAxis = Vector3.TransformCoordinates(this.physicalProperties.rotationAxis, Matrix.RotationAxis(axis, amount));
    }
}