import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { expect, it } from "vitest";

import { getCameraVerticalFov } from "./getCameraVerticalFov";

it("reads vertical FOV from the projection for either camera FOV mode", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        camera.fov = Math.PI / 3;
        expect(getCameraVerticalFov(camera)).toBeCloseTo(camera.fov);
        camera.fov = Math.PI / 6;
        expect(getCameraVerticalFov(camera)).toBeCloseTo(camera.fov);
        camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
        expect(getCameraVerticalFov(camera)).toBeCloseTo(
            2 * Math.atan(Math.tan(camera.fov / 2) / engine.getAspectRatio(camera)),
        );
    } finally {
        scene.dispose();
        engine.dispose();
    }
});
