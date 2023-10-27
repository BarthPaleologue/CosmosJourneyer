import { Vector3, Quaternion, Matrix } from "@babylonjs/core/Maths/math";
import { BaseObject, OrbitalObject } from "../common";
import { BaseModel } from "../../model/common";
import { Scene } from "@babylonjs/core/scene";
import { getPointOnOrbit } from "../../model/orbit/orbit";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Cullable } from "./cullable";
import { LinesMesh, TransformNode } from "@babylonjs/core/Meshes";
import { getRotationQuaternion, rotateAround, setRotationQuaternion, translate } from "../../controller/uberCore/transforms/basicTransform";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Settings } from "../../settings";

export abstract class AbstractObject implements OrbitalObject, BaseObject, Cullable {
    private readonly transform: TransformNode;

    readonly postProcesses: PostProcessType[] = [];

    //TODO: make an universal clock ?? or not it could be funny
    private internalClock = 0;

    readonly name: string;

    abstract readonly model: BaseModel;

    readonly parentObject: OrbitalObject | null;

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param parentObject the parent object of this object
     * @param scene
     */
    protected constructor(name: string, scene: Scene, parentObject?: OrbitalObject) {
        this.name = name;

        this.parentObject = parentObject ?? null;

        this.transform = new TransformNode(name, scene);
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public abstract getBoundingRadius(): number;

    /**
     * Returns the axis of rotation of the body
     */
    public getRotationAxis(): Vector3 {
        return this.transform.up;
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

    public updateOrbitalPosition(deltaTime: number) {
        if (this.model.orbit.period > 0 && this.parentObject !== null) {
            this.parentObject.getTransform().computeWorldMatrix(true);
            const barycenter = this.parentObject.getTransform().getAbsolutePosition();

            const dtheta = (2 * Math.PI * deltaTime) / this.model.orbit.period;
            rotateAround(this.transform, barycenter, this.model.orbit.normalToPlane, dtheta);
            const oldPosition = this.transform.getAbsolutePosition().subtract(barycenter);
            const newPosition = oldPosition.normalizeToNew().scaleInPlace(this.model.orbit.radius);
            translate(this.transform, newPosition.subtract(oldPosition));
        }
    }

    public getDeltaTheta(deltaTime: number) {
        if (this.model.physicalProperties.rotationPeriod === 0) return 0;
        return (2 * Math.PI * deltaTime) / this.model.physicalProperties.rotationPeriod;
    }

    /**
     * Updates the rotation of the body around its axis
     * @param deltaTime The time elapsed since the last update
     * @returns The elapsed angle of rotation around the axis
     */
    public updateRotation(deltaTime: number) {
        const dtheta = this.getDeltaTheta(deltaTime);
        if (dtheta === 0) return;

        const elementaryRotationQuaternion = Quaternion.RotationAxis(this.getRotationAxis(), dtheta);
        const newQuaternion = elementaryRotationQuaternion.multiply(getRotationQuaternion(this.transform));

        setRotationQuaternion(this.transform, newQuaternion);
    }

    public abstract computeCulling(camera: Camera): void;

    public dispose(): void {
        this.transform.dispose();
    }
}
