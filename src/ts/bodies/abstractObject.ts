import { Vector3, Quaternion } from "@babylonjs/core/Maths/math";
import { BaseModel } from "../model/common";
import { Scene } from "@babylonjs/core/scene";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { BaseObject, Common } from "./common";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getRotationQuaternion, setRotationQuaternion, translate } from "../uberCore/transforms/basicTransform";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import { OrbitalObject } from "../orbit/orbit";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { rotateVector3AroundInPlace } from "../utils/algebra";

export abstract class AbstractObject implements OrbitalObject, BaseObject, Common {
    private readonly transform: TransformNode;

    readonly aggregate: PhysicsAggregate;

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

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;
    }

    public getTransform(): TransformNode {
        return this.transform;
    }

    public abstract getBoundingRadius(): number;

    public abstract getTypeName(): string;

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

    public computeNextOrbitalPosition(deltaTime: number) {
        if (this.model.orbit.period === 0 || this.parentObject === null) return this.transform.getAbsolutePosition();

        const barycenter = this.parentObject.getTransform().getAbsolutePosition();

        // enforce distance to orbit center
        const oldPosition = this.transform.getAbsolutePosition().subtract(barycenter);
        const newPosition = oldPosition.clone();

        // rotate the object around the barycenter of the orbit, around the normal to the orbital plane
        const dtheta = (2 * Math.PI * deltaTime) / this.model.orbit.period;
        rotateVector3AroundInPlace(newPosition, barycenter, this.model.orbit.normalToPlane, dtheta);

        newPosition.normalize().scaleInPlace(this.model.orbit.radius);

        // enforce orbital plane
        const correctionAxis = Vector3.Cross(this.model.orbit.normalToPlane, newPosition.normalizeToNew());
        const correctionAngle = 0.5 * Math.PI - Vector3.GetAngleBetweenVectors(this.model.orbit.normalToPlane, newPosition.normalizeToNew(), correctionAxis);
        newPosition.applyRotationQuaternionInPlace(Quaternion.RotationAxis(correctionAxis, correctionAngle));

        return newPosition.addInPlace(barycenter);
    }

    public updateOrbitalPosition(deltaTime: number) {
        if (this.model.orbit.period === 0 || this.parentObject === null) return;

        const oldPosition = this.transform.getAbsolutePosition();
        const newPosition = this.computeNextOrbitalPosition(deltaTime);
        translate(this.transform, newPosition.subtractInPlace(oldPosition));
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
