import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { CelestialBody } from "./celestialBody";

export interface StellarObject extends CelestialBody {
    getLight(): PointLight;
}
