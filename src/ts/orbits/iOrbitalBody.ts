import { PhysicalProperties } from "../bodies/physicalProperties";
import { IOrbitalProperties } from "./iOrbitalProperties";
import { ITransformable } from "../core/transforms/iTransformable";
import { BodyType } from "../bodies/interfaces";

export interface IOrbitalBody extends ITransformable {
    /**
     * Describes the fundamental properties of the body used in physical computations
     */
    physicalProperties: PhysicalProperties;

    /**
     * Describes the fundamental properties of the body used in orbital computations
     */
    orbitalProperties: IOrbitalProperties;

    /**
     * The array of bodies immediately above in the orbit hierarchy
     */
    parentBodies: IOrbitalBody[];

    /**
     * The array of bodies immediately beneath in the orbit hierarchy
     */
    childrenBodies: IOrbitalBody[];

    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    /**
     * A label identifying the type of the body
     */
    bodyType: BodyType;
}
