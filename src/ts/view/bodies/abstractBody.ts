import { BodyModel } from "../../model/common";
import { Scene } from "@babylonjs/core/scene";
import { AbstractObject } from "./abstractObject";

export abstract class AbstractBody extends AbstractObject {
    abstract readonly model: BodyModel;

    /**
     * An abstract representation of a celestial body
     * @param name the name of the celestial body
     * @param parentBody the parent body of this body
     * @param scene
     */
    protected constructor(name: string, scene: Scene, parentBody?: AbstractBody) {
        super(name, scene, parentBody);
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
