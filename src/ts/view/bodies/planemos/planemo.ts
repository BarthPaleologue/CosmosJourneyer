import { AbstractController } from "../../../controller/uberCore/abstractController";
import { PlanemoModel } from "../../../model/common";
import { AbstractBody } from "../abstractBody";
import { StellarObject } from "../stellarObjects/stellarObject";

export interface Planemo extends AbstractBody {
    model: PlanemoModel;
}

export interface PlanemoMaterial {
    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void;
}