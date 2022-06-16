import { IPhysicalProperties } from "../celestialBodies/iPhysicalProperties";
import { IOrbitalProperties } from "../celestialBodies/iOrbitalProperties";
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
     * The array of bodies accounted for in the orbital computations of the current body
     */
    relevantBodies: IOrbitalBody[]; // might go to private at some point

    /**
     * Add another body to the orbital computations for the current body
     * @param body
     */
    addRelevantBody: (body: IOrbitalBody) => void;

    /**
     * Removes another body from the orbital computations of the current body
     * @param body
     */
    removeRelevantBody: (body: IOrbitalBody) => void;
}
