import {Vector3, Quaternion, Space, Matrix} from "@babylonjs/core";
import {Algebra} from "../utils/algebra";
import {
    CelestialBodyType,
    Transformable
} from "./interfaces";
import {PlayerController} from "../player/playerController";
import {StarSystemManager} from "./starSystemManager";
import {BodyPhysicalProperties} from "./physicalPropertiesInterfaces";
import {BodyPostProcesses, PlanetPostProcesses} from "./postProcessesInterfaces";
import {OrbitalProperties} from "./orbitalPropertiesInterface";
import {computeBarycenter, computePointOnOrbit} from "../utils/kepler";
import {Settings} from "../settings";

export abstract class CelestialBody implements Transformable {
    protected abstract bodyType: CelestialBodyType;

    abstract physicalProperties: BodyPhysicalProperties;
    orbitalProperties: OrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly _starSystemManager: StarSystemManager;

    readonly _name: string;

    protected constructor(name: string, starSystemManager: StarSystemManager) {
        this._name = name;
        this._starSystemManager = starSystemManager;
        starSystemManager.addBody(this);

        this.orbitalProperties = {
            periapsis: this.getRadius() * 5,
            apoapsis: this.getRadius() * 5,
            period: 0
        }
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
        if (this.orbitalProperties.period > 0) {
            let barycenter = computeBarycenter(this, this._starSystemManager.getBodies());

            let initialPosition = this.getAbsolutePosition().clone();
            let newPosition = computePointOnOrbit(barycenter, this.orbitalProperties.periapsis, this.orbitalProperties.apoapsis, this.orbitalProperties.period, this._starSystemManager.getTime())

            if (player.isOrbiting(this)) player.translate(newPosition.subtract(initialPosition));
            this.setAbsolutePosition(newPosition);
        }

        if(this.physicalProperties.rotationPeriod > 0) {
            let dtheta = 2 * Math.PI * deltaTime / this.physicalProperties.rotationPeriod;

            if (player.isOrbiting(this)) player.rotateAround(this.getAbsolutePosition(), this.physicalProperties.rotationAxis, -dtheta);
            this.rotate(this.physicalProperties.rotationAxis, -dtheta);
        }
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