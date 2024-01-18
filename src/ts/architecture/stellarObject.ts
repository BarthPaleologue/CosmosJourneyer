import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CelestialBody, CelestialBodyModel } from "./celestialBody";
import { STELLAR_TYPE } from "../stellarObjects/common";

export interface StellarObject extends CelestialBody {
    model: StellarObjectModel;

    getLight(): PointLight;
}

export interface StellarObjectModel extends CelestialBodyModel {
    stellarType: STELLAR_TYPE;
}