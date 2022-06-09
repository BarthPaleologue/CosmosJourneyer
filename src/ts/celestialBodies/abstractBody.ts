import { Vector3, Quaternion, Space, TransformNode, Scene } from "@babylonjs/core";
import { BodyType, Transformable } from "./interfaces";
import { PlayerController } from "../player/playerController";
import { StarSystemManager } from "./starSystemManager";
import { IPhysicalProperties } from "./iPhysicalProperties";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalProperties } from "./iOrbitalProperties";
import { computeBarycenter, computePointOnOrbit } from "../utils/kepler";
import { Star } from "./stars/star";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { IOrbitalBody } from "./iOrbitalBody";

export abstract class AbstractBody implements Transformable, IOrbitalBody {
    protected abstract bodyType: BodyType;

    abstract physicalProperties: IPhysicalProperties;
    orbitalProperties: IOrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly _starSystemManager: StarSystemManager;

    readonly _name: string;

    readonly transform: TransformNode;

    relevantBodies: IOrbitalBody[] = [];

    protected constructor(name: string, starSystemManager: StarSystemManager) {
        this._name = name;
        this._starSystemManager = starSystemManager;
        starSystemManager.addBody(this);

        this.transform = new TransformNode(`${name}Transform`);
        this.transform.position = Vector3.Zero();
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.orbitalProperties = {
            periapsis: this.getRadius() * 5,
            apoapsis: this.getRadius() * 5,
            period: 0
        };
    }

    /**
     * Returns the name of the body
     */
    public getName(): string {
        return this._name;
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.transform.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        if (this.transform.getAbsolutePosition()._isDirty) this.transform.computeWorldMatrix(true);
        return this.transform.getAbsolutePosition();
    }

    public translate(displacement: Vector3): void {
        this.setAbsolutePosition(this.getAbsolutePosition().add(displacement));
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.transform.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number) {
        this.transform.rotate(axis, amount, Space.WORLD);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.transform.rotationQuaternion == undefined) throw new Error(`Undefined quaternion for ${this.getName()}`);
        if (this.transform.rotationQuaternion._isDirty) this.transform.computeWorldMatrix(true);
        return this.transform.rotationQuaternion;
    }

    public getInverseRotationQuaternion(): Quaternion {
        return this.getRotationQuaternion().invert();
    }

    /**
     * Returns the body type of the body (useful for casts)
     */
    public getBodyType(): BodyType {
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

    public createRings(star: Star, scene: Scene): RingsPostProcess {
        let rings = new RingsPostProcess(`${this.getName()}Rings`, this, star, scene);
        this.postProcesses.rings = rings;
        return rings;
    }

    public addRelevantBody(body: IOrbitalBody): void {
        this.relevantBodies.push(body);
    }

    public removeRelevantBody(body: IOrbitalBody): void {
        let newRelevantBodies = [];
        for(const relevantBody of this.relevantBodies) {
            if(body != relevantBody) newRelevantBodies.push(relevantBody);
        }
        this.relevantBodies = newRelevantBodies;
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
            let newPosition = computePointOnOrbit(
                barycenter,
                this.orbitalProperties.periapsis,
                this.orbitalProperties.apoapsis,
                this.orbitalProperties.period,
                this._starSystemManager.getTime()
            );

            if (player.isOrbiting(this)) player.translate(newPosition.subtract(initialPosition));
            this.setAbsolutePosition(newPosition);
        }

        if (this.physicalProperties.rotationPeriod > 0) {
            let dtheta = (2 * Math.PI * deltaTime) / this.physicalProperties.rotationPeriod;

            if (player.isOrbiting(this)) player.rotateAround(this.getAbsolutePosition(), this.transform.up, -dtheta);
            this.rotate(this.transform.up, -dtheta);
        }
    }
}
