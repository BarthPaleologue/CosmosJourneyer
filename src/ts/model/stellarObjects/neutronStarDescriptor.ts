import { BodyModel } from "../common";
import { StarModel } from "./starModel";

export class NeutronStarDescriptor extends StarModel {
    constructor(seed: number, parentBody?: BodyModel) {
        super(seed, parentBody);
    }
}