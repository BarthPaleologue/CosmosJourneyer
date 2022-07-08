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
import { centeredRand, randRange } from "extended-random";
import { alea } from "seedrandom";

export abstract class AbstractBody implements IOrbitalBody, ISeedable {
    abstract readonly bodyType: BodyType;

    abstract physicalProperties: IPhysicalProperties;
    orbitalProperties: IOrbitalProperties;
    abstract postProcesses: BodyPostProcesses;

    readonly starSystem: StarSystemManager;

    readonly name: string;

    readonly seed: number;

    readonly rng: () => number;

    abstract readonly radius: number;

    readonly transform: TransformNode;

    readonly parentBodies: IOrbitalBody[];
    readonly childrenBodies: IOrbitalBody[] = [];

    depth: number;

    protected constructor(name: string, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        this.name = name;
        this.seed = seed;

        this.rng = alea(seed.toString());

        this.starSystem = starSystemManager;
        starSystemManager.addBody(this);

        this.parentBodies = parentBodies;

        let minDepth = -1;
        for (const parentBody of parentBodies) {
            if (minDepth == -1) minDepth = parentBody.depth;
            else minDepth = Math.min(minDepth, parentBody.depth);
        }
        if (minDepth == -1) this.depth = 0;
        else this.depth = minDepth + 1;

        this.transform = new TransformNode(`${name}Transform`);

        this.rotate(Axis.X, centeredRand(this.rng) / 2);
        this.rotate(Axis.Z, centeredRand(this.rng) / 2);

        // TODO: do not hardcode
        const periapsis = this.rng() * 5000000e3;
        const apoapsis = periapsis * (1 + this.rng() / 10);

        this.orbitalProperties = {
            periapsis: periapsis,
            apoapsis: apoapsis,
            period: getOrbitalPeriod(periapsis, apoapsis, this.parentBodies),
            orientationQuaternion: Quaternion.Identity()
        };
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
        if (this.transform.rotationQuaternion == undefined) throw new Error(`Undefined quaternion for ${this.name}`);
        return this.transform.rotationQuaternion;
    }

    public getInverseRotationQuaternion(): Quaternion {
        return this.getRotationQuaternion().invert();
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

    public createRings(star: Star, scene: Scene): RingsPostProcess {
        const rings = new RingsPostProcess(`${this.name}Rings`, this, this.starSystem);
        rings.settings.ringStart = randRange(1.8, 2.2, this.rng);
        rings.settings.ringEnd = randRange(2.1, 2.9, this.rng);
        rings.settings.ringOpacity = this.rng();
        this.postProcesses.rings = rings;
        return rings;
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
            const newPosition = computePointOnOrbit(barycenter, this.orbitalProperties, this.starSystem.getTime());

            if (player.isOrbiting(this, 50 / (this.depth + 1) ** 3)) player.translate(newPosition.subtract(initialPosition));
            this.setAbsolutePosition(newPosition);
        }

        if (this.physicalProperties.rotationPeriod > 0) {
            const dtheta = (2 * Math.PI * deltaTime) / this.physicalProperties.rotationPeriod;

            if (player.isOrbiting(this)) player.rotateAround(this.getAbsolutePosition(), this.transform.up, -dtheta);
            this.rotate(this.transform.up, -dtheta);
        }
    }
}
