import { Camera } from "@babylonjs/core/Cameras/camera";

export interface Cullable {
    computeCulling(camera: Camera): void;
}
