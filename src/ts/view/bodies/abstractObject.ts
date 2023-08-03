import { Vector3, Quaternion, Matrix } from "@babylonjs/core/Maths/math";
import { BaseObject, IOrbitalObject } from "../../model/orbits/iOrbitalObject";
import { BaseModel } from "../../model/common";
import { Scene } from "@babylonjs/core/scene";
import { computeBarycenter, computePointOnOrbit } from "../../model/orbits/kepler";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Cullable } from "./cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getRotationQuaternion, setRotationQuaternion } from "../../controller/uberCore/transforms/basicTransform";

export interface NextState {
    position: Vector3;
    rotation: Quaternion;
}

export abstract class AbstractObject implements IOrbitalObject, BaseObject, Cullable {
    readonly transform: TransformNode;

    readonly nextState: NextState = {
        position: Vector3.Zero(),
        rotation: Quaternion.Identity()
    };

    readonly postProcesses: PostProcessType[] = [];

    //TODO: make an universal clock ?? or not it could be funny
    private internalClock = 0;

    private theta = 0;
    readonly rotationMatrixAroundAxis = new Matrix();

    readonly name: string;

    abstract readonly model: BaseModel;

    readonly parentObjects: IOrbitalObject[];

    depth: number;

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param parentObjects the parent objects of this object
     * @param scene
     */
    protected constructor(name: string, parentObjects: AbstractObject[], scene: Scene) {
        this.name = name;

        this.parentObjects = parentObjects;

        this.transform = new TransformNode(name, scene);

        let minDepth = -1;
        for (const parentBody of parentObjects) {
            if (minDepth === -1) minDepth = parentBody.depth;
            else minDepth = Math.min(minDepth, parentBody.depth);
        }
        if (minDepth === -1) this.depth = 0;
        else this.depth = minDepth + 1;
    }

    public abstract getBoundingRadius(): number;

    /**
     * Returns the axis of rotation of the body
     */
    public getRotationAxis(): Vector3 {
        return this.transform.up;
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
        if (this.model.orbitalProperties.period > 0) {
            const [barycenter, orientationQuaternion] = computeBarycenter(this, this.parentObjects);
            if (this.model.orbitalProperties.isPlaneAlignedWithParent) this.model.orbitalProperties.orientationQuaternion = orientationQuaternion;

            const newPosition = computePointOnOrbit(barycenter, this.model.orbitalProperties, this.internalClock);
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
        if (this.model.physicalProperties.rotationPeriod === 0) {
            this.nextState.rotation.copyFrom(getRotationQuaternion(this.transform));
            return 0;
        }

        const dtheta = (2 * Math.PI * deltaTime) / this.model.physicalProperties.rotationPeriod;
        this.theta += dtheta;

        this.rotationMatrixAroundAxis.copyFrom(Matrix.RotationAxis(new Vector3(0, 1, 0), this.theta));

        const elementaryRotationMatrix = Matrix.RotationAxis(this.getRotationAxis(), dtheta);
        const elementaryRotationQuaternion = Quaternion.FromRotationMatrix(elementaryRotationMatrix);
        const newQuaternion = elementaryRotationQuaternion.multiply(getRotationQuaternion(this.transform));

        this.nextState.rotation.copyFrom(newQuaternion);

        return dtheta;
    }

    public applyNextState(): void {
        this.transform.setAbsolutePosition(this.nextState.position);
        setRotationQuaternion(this.transform, this.nextState.rotation);
    }

    public abstract computeCulling(cameraPosition: Vector3): void;

    public dispose(): void {
        this.transform.dispose();
    }
}
