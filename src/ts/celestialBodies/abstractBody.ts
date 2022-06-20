import { Vector3, Quaternion, Space, TransformNode, Scene, Axis } from "@babylonjs/core";
import { BodyType, ISeedable } from "./interfaces";
import { PlayerController } from "../player/playerController";
import { StarSystemManager } from "./starSystemManager";
import { IPhysicalProperties } from "./iPhysicalProperties";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalProperties } from "../orbits/iOrbitalProperties";
import { computeBarycenter, computePointOnOrbit, getOrbitalPeriod } from "../orbits/kepler";
import { Star } from "./stars/star";
import { RingsPostProcess } from "../postProcesses/planetPostProcesses/ringsPostProcess";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { centeredRand } from "extended-random";
import { alea } from "seedrandom";

export abstract class AbstractBody implements IOrbitalBody, ISeedable {
    protected abstract bodyType: BodyType;

    abstract physicalProperties: IPhysicalProperties;
    orbitalProperties: IOrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly _starSystemManager: StarSystemManager;

    protected readonly _name: string;

    protected readonly _seed: number;

    readonly rng: () => number;

    readonly _radius: number;

    readonly transform: TransformNode;

    readonly parentBodies: IOrbitalBody[];
    readonly childrenBodies: IOrbitalBody[] = [];

    protected constructor(name: string, radius: number, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        this._name = name;
        this._seed = seed;
        this._radius = radius;

        this.rng = alea(seed.toString());

        this._starSystemManager = starSystemManager;
        starSystemManager.addBody(this);

        this.parentBodies = parentBodies;

        this.transform = new TransformNode(`${name}Transform`);

        this.rotate(Axis.X, centeredRand(this.rng) / 2);
        this.rotate(Axis.Z, centeredRand(this.rng) / 2);

        const periapsis = this.rng() * 10000000e3;
        const apoapsis = periapsis * (1 + this.rng() / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, this.parentBodies),
            orientationQuaternion: Quaternion.Identity()
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
    public getRadius(): number {
        return this._radius;
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

    public createRings(star: Star, scene: Scene): RingsPostProcess {
        let rings = new RingsPostProcess(`${this.getName()}Rings`, this, star, scene);
        this.postProcesses.rings = rings;
        return rings;
    }

    public getSeed(): number {
        return this._seed;
    }

    /**
     * Updates the state of the celestial body for a given time step of deltaTime
     * @param player the player in the simulation
     * @param lightPosition the position of the main light source
     * @param deltaTime the time step to update for
     */
    public update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        if (this.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.orbitalProperties.orientationQuaternion = orientationQuaternion;

            //TODO: orient the planet accurately

            const initialPosition = this.getAbsolutePosition().clone();
            const newPosition = computePointOnOrbit(barycenter, this.orbitalProperties, this._starSystemManager.getTime());

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
