import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

/**
 * From a given source camera, computes its position and rotation in world space and applies it to the target camera
 * @param sourceCamera The camera to copy the position and rotation from
 * @param targetCamera the camera to apply the position and rotation to
 * @see https://forum.babylonjs.com/t/gui-linkwithmesh-not-behaving-properly-using-right-handed-system/48089/8
 */
export function syncCamera(sourceCamera: Camera, targetCamera: FreeCamera) {
    targetCamera.position = sourceCamera.globalPosition;
    targetCamera.rotationQuaternion = sourceCamera.absoluteRotation;

    targetCamera.fov = sourceCamera.fov;
    targetCamera.minZ = sourceCamera.minZ;
    targetCamera.maxZ = sourceCamera.maxZ;

    // this is necessary to ensure the view matrix is overwritten
    const observer = targetCamera.onViewMatrixChangedObservable.addOnce(() => {
        targetCamera.getViewMatrix().copyFrom(sourceCamera.getViewMatrix());
    });

    // if the camera stay stills, the view matrix is never updated, hence the number of observers keeps growing
    // to avoid memory leaks, we remove the observer after the next render
    targetCamera.getScene().onAfterRenderObservable.addOnce(() => {
        targetCamera.onViewMatrixChangedObservable.remove(observer);
    });
}
