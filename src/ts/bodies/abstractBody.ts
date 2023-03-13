import { Matrix, Vector3 } from "@babylonjs/core";
import { BodyType } from "./interfaces";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { BodyDescriptor } from "../descriptors/interfaces";
import { computeBarycenter, computePointOnOrbit } from "../orbits/kepler";

export abstract class AbstractBody implements IOrbitalBody {
    abstract readonly bodyType: BodyType;

    readonly transform: BasicTransform;

    abstract readonly postProcesses: BodyPostProcesses;

    //TODO: make an universal clock ?? or not it could be funny
    private internalClock = 0;

    private theta = 0;
    readonly rotationMatrixAroundAxis = new Matrix();

    readonly name: string;

    abstract readonly descriptor: BodyDescriptor;

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
        return this.descriptor.radius;
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

    /**
     * Returns the rotation angle of the body around its axis
     * @returns the rotation angle of the body around its axis
     */
    public getRotationAngle(): number {
        return this.theta;
    }

    /**
     * Returns the internal clock of the body (in seconds)
     * @returns the internal clock of the body (in seconds)
     */
    public getInternalClock(): number {
        return this.internalClock;
    }

    /**
     * Updates the internal clock of the body by adding the time elapsed since the last update
     * @param deltaTime the time elapsed since the last update
     */
    public updateInternalClock(deltaTime: number): void {
        this.internalClock += deltaTime;
    }

    public updateOrbitalPosition(): Vector3 {
        if (this.descriptor.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.descriptor.orbitalProperties.orientationQuaternion = orientationQuaternion;

            const newPosition = computePointOnOrbit(barycenter, this.descriptor.orbitalProperties, this.internalClock);
            this.transform.setAbsolutePosition(newPosition);
        }

        return this.transform.getAbsolutePosition();
    }

    /**
     * Updates the rotation of the body around its axis
     * @param deltaTime The time elapsed since the last update
     * @returns The elapsed angle of rotation around the axis
     */
    public updateRotation(deltaTime: number): number {
        if (this.descriptor.physicalProperties.rotationPeriod == 0) return 0;

        const dtheta = -(2 * Math.PI * deltaTime) / this.descriptor.physicalProperties.rotationPeriod;
        this.transform.rotate(this.getRotationAxis(), dtheta);

        this.theta += dtheta;
        this.rotationMatrixAroundAxis.copyFrom(Matrix.RotationAxis(this.getRotationAxis(), this.theta));

        return dtheta;
    }
}
