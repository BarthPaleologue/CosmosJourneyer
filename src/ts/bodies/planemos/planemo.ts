import { AbstractController } from "../../uberCore/abstractController";
import { PlanemoDescriptor } from "../../descriptors/common";
import { StellarObject } from "../stellarObjects/stellarObject";

export interface Planemo {
    descriptor: PlanemoDescriptor;
    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void;
}
