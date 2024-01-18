import { StarModel } from "../star/starModel";
import { CelestialBodyModel } from "../../architecture/celestialBody";

export class NeutronStarModel extends StarModel {
    constructor(seed: number, parentBody: CelestialBodyModel | null = null) {
        super(seed, parentBody);
    }
}
