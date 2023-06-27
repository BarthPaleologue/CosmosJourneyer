import { AbstractController } from "../../uberCore/abstractController";
import { PlanemoModel } from "../../models/common";
import { StellarObject } from "../stellarObjects/stellarObject";

export interface Planemo {
    model: PlanemoModel;
    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void;
}
