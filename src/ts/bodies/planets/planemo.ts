import { AbstractController } from "../../uberCore/abstractController";
import { Star } from "../stars/star";
import { BlackHole } from "../stars/blackHole";
import { PlanemoDescriptor } from "../../descriptors/interfaces";

export interface Planemo {
    descriptor: PlanemoDescriptor;
    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[], deltaTime: number): void;
}
