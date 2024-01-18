import { Camera } from "@babylonjs/core/Cameras/camera";
import { Transformable } from "../uberCore/transforms/basicTransform";

export interface Cullable {
    computeCulling(camera: Camera): void;
}

export interface BoundingSphere extends Transformable {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}
