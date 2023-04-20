import { BodyDescriptor } from "../common";
import { StarDescriptor } from "./starDescriptor";

export class NeutronStarDescriptor extends StarDescriptor {
    constructor(seed: number, parentBodies: BodyDescriptor[]) {
        super(seed, parentBodies);
    }
}