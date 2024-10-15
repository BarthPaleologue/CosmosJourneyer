import { PlanetaryMassObject, PlanetaryMassObjectModel } from "./planetaryMassObject";
import { OrbitalObjectType } from "./orbitalObject";

export interface Planet extends PlanetaryMassObject {
    readonly model: PlanetModel;
}

export type PlanetModel = PlanetaryMassObjectModel & {
    readonly type: OrbitalObjectType.TELLURIC_PLANET | OrbitalObjectType.GAS_PLANET;
};
