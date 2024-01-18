import { Camera } from "@babylonjs/core/Cameras/camera";
import { CelestialBody, CelestialBodyModel } from "./celestialBody";
import { PlanetPhysicalProperties } from "./physicalProperties";
import { Transformable } from "./transformable";

export interface Planet extends CelestialBody {
    model: PlanetModel;

    updateMaterial(controller: Camera, stellarObjects: Transformable[], deltaTime: number): void;
}

export interface PlanetModel extends CelestialBodyModel {
    physicalProperties: PlanetPhysicalProperties;

    nbMoons: number;

    getApparentRadius(): number;
}
