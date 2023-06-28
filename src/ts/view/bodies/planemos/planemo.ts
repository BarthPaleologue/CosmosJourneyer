import { AbstractController } from "../../../controller/uberCore/abstractController";
import { PlanemoModel } from "../../../model/common";
import { StellarObject } from "../stellarObjects/stellarObject";

export interface Planemo {
    model: PlanemoModel;
    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void;
}
