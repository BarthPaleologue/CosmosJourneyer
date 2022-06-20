import { IPhysicalProperties } from "../celestialBodies/iPhysicalProperties";
import { IOrbitalProperties } from "./iOrbitalProperties";
import { ITransformable } from "../celestialBodies/iTransformable";

export interface IOrbitalBody extends ITransformable {
    /**
     * Describes the fundamental properties of the body used in physical computations
     */
    physicalProperties: IPhysicalProperties;

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
}
