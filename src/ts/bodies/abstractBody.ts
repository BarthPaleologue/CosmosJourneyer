import { BodyModel } from "../models/common";
import { Scene } from "@babylonjs/core/scene";
import { AbstractObject } from "./abstractObject";

export abstract class AbstractBody extends AbstractObject {
    abstract readonly model: BodyModel;

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param parentBodies the parent bodies of this body
     */
    protected constructor(name: string, parentBodies: AbstractBody[], scene: Scene) {
        super(name, parentBodies, scene);
    }

    /**
     * Returns the radius of the celestial body
     */
    public getRadius(): number {
        return this.model.radius;
    }

    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    public override getBoundingRadius(): number {
        return this.getRadius();
    }

    /**
     * Returns the diameter of the celestial body
     */
    public getDiameter(): number {
        return 2 * this.getRadius();
    }
}
