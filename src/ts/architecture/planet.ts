import { Camera } from "@babylonjs/core/Cameras/camera";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { CelestialBody, CelestialBodyModel, HasCelestialBodyModel } from "./celestialBody";
import { PlanetPhysicalProperties } from "./physicalProperties";

export interface Planet extends CelestialBody {
    updateMaterial(controller: Camera, stellarObjects: Transformable[], deltaTime: number): void;
}

export interface PlanetModel extends CelestialBodyModel {
    physicalProperties: PlanetPhysicalProperties;

    nbMoons: number;

    getApparentRadius(): number;
}

export interface HasPlanetModel extends HasCelestialBodyModel {
    model: PlanetModel;
}