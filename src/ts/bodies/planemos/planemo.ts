import { AbstractController } from "../../uberCore/abstractController";
import { Star } from "../stellarObjects/star";
import { BlackHole } from "../stellarObjects/blackHole";
import { PlanemoDescriptor } from "../../descriptors/common";

export interface Planemo {
    descriptor: PlanemoDescriptor;
    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[], deltaTime: number): void;
}
