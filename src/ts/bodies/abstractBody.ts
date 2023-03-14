import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { BodyPostProcesses } from "./postProcessesInterfaces";
import { IOrbitalBody } from "../orbits/iOrbitalBody";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { BodyDescriptor } from "../descriptors/common";
import { computeBarycenter, computePointOnOrbit } from "../orbits/kepler";

interface NextState {
    position: Vector3;
    rotation: Quaternion;
}

export abstract class AbstractBody implements IOrbitalBody {
    readonly transform: BasicTransform;
    readonly nextState: NextState = {
        position: Vector3.Zero(),
        rotation: Quaternion.Identity()
    };

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

    public computeNextOrbitalPosition(): Vector3 {
        if (this.descriptor.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentBodies);
            this.descriptor.orbitalProperties.orientationQuaternion = orientationQuaternion;

            const newPosition = computePointOnOrbit(barycenter, this.descriptor.orbitalProperties, this.internalClock);
            this.nextState.position.copyFrom(newPosition);
        } else {
            this.nextState.position.copyFrom(this.transform.getAbsolutePosition());
        }

        return this.nextState.position;
    }

    /**
     * Updates the rotation of the body around its axis
     * @param deltaTime The time elapsed since the last update
     * @returns The elapsed angle of rotation around the axis
     */
    public updateRotation(deltaTime: number): number {
        if (this.descriptor.physicalProperties.rotationPeriod == 0) {
            this.nextState.rotation.copyFrom(this.transform.getRotationQuaternion());
            return 0;
        }

        const dtheta = -(2 * Math.PI * deltaTime) / this.descriptor.physicalProperties.rotationPeriod;
        this.theta += dtheta;

        this.rotationMatrixAroundAxis.copyFrom(Matrix.RotationAxis(new Vector3(0, 1, 0), this.theta));

        const elementaryRotationMatrix = Matrix.RotationAxis(this.getRotationAxis(), dtheta);
        const elementaryRotationQuaternion = Quaternion.FromRotationMatrix(elementaryRotationMatrix);
        const newQuaternion = elementaryRotationQuaternion.multiply(this.transform.getRotationQuaternion());

        this.nextState.rotation.copyFrom(newQuaternion);

        return dtheta;
    }

    public applyNextState(): void {
        this.transform.setAbsolutePosition(this.nextState.position);
        this.transform.setRotationQuaternion(this.nextState.rotation);
    }
}
