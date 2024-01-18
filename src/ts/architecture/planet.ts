import { Camera } from "@babylonjs/core/Cameras/camera";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { CelestialBody } from "./celestialBody";

export interface Planet extends CelestialBody {
    updateMaterial(controller: Camera, stellarObjects: Transformable[], deltaTime: number): void;
}
