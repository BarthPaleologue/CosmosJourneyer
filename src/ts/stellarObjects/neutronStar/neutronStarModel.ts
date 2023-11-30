import { StarModel } from "../star/starModel";
import { BodyModel } from "../../model/common";

export class NeutronStarModel extends StarModel {
    constructor(seed: number, parentBody?: BodyModel) {
        super(seed, parentBody);
    }
}
