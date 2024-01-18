import { RingsUniforms } from "../postProcesses/rings/ringsUniform";

export interface CanHaveRings {
    getRingsUniforms(): RingsUniforms | null;
}
