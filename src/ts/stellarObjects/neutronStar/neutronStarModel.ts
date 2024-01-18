import { StarModel } from "../star/starModel";
import { CelestialBodyModel } from "../../model/common";

export class NeutronStarModel extends StarModel {
    constructor(seed: number, parentBody?: CelestialBodyModel) {
        super(seed, parentBody);
    }
}
