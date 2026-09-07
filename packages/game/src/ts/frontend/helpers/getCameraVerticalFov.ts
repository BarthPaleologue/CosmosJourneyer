import { Camera } from "@babylonjs/core/Cameras/camera";

/** Resolves the vertical FOV, including horizontal-fixed cameras and their aspect ratio. */
export function getCameraVerticalFov(camera: Camera): number {
    return camera.fovMode === Camera.FOVMODE_VERTICAL_FIXED
        ? camera.fov
        : 2 * Math.atan(Math.tan(camera.fov / 2) / camera.getEngine().getAspectRatio(camera));
}
