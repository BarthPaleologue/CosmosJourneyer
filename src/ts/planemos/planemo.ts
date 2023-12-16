import { PlanemoModel } from "../model/common";
import { AbstractBody } from "../bodies/abstractBody";
import { StellarObject } from "../stellarObjects/stellarObject";
import { Camera } from "@babylonjs/core/Cameras/camera";

export interface Planemo extends AbstractBody {
    model: PlanemoModel;
}

export interface PlanemoMaterial {
    updateMaterial(controller: Camera, stellarObjects: StellarObject[], deltaTime: number): void;
}
