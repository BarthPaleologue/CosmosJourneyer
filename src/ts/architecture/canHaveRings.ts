import { RingsUniforms } from "../postProcesses/rings/ringsUniform";

/**
 * Describes objects that can have a ring system
 */
export interface CanHaveRings {
    /**
     * Returns the uniforms used to render the rings, or null if the object has no rings
     */
    getRingsUniforms(): RingsUniforms | null;
}
