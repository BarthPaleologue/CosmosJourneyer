import { Camera } from "@babylonjs/core/Cameras/camera";

export interface Cullable {
    computeCulling(camera: Camera): void;
}

export interface BoundingSphere {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}
