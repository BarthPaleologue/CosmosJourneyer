//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterAll, describe, expect, it, vi } from "vitest";

import type { Vehicle } from "./vehicle";
import { VehicleControls } from "./vehicleControls";
import { VehicleInputs } from "./vehicleControlsInputs";

describe("VehicleControls", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    afterAll(() => {
        scene.dispose();
        engine.dispose();
    });

    it("releases input subscriptions with the scene while preserving live controls", () => {
        const disposedScene = new Scene(engine);
        const disposedControls = new VehicleControls(disposedScene);
        const disposedSwitch = vi.spyOn(disposedControls, "switchToFirstPersonCamera");
        disposedScene.dispose();

        const liveScene = new Scene(engine);
        const liveControls = new VehicleControls(liveScene);
        const liveSwitch = vi.spyOn(liveControls, "switchToFirstPersonCamera");
        VehicleInputs.setEnabled(true);
        try {
            window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyB" }));
            window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyB" }));
            expect(disposedSwitch).not.toHaveBeenCalled();
            expect(liveSwitch).toHaveBeenCalledOnce();
        } finally {
            VehicleInputs.setEnabled(false);
            liveScene.dispose();
            vi.restoreAllMocks();
        }
    });

    it("detaches the first person camera before releasing the vehicle", () => {
        const vehicleTransform = new TransformNode("vehicleTransform", scene);
        const vehicle = {
            getTransform: () => vehicleTransform,
        } as unknown as Vehicle;
        const vehicleControls = new VehicleControls(scene);

        vehicleControls.setVehicle(vehicle);
        expect(vehicleControls.firstPersonCamera.parent).toBe(vehicleTransform);

        vehicleControls.setVehicle(null);

        expect(vehicleControls.firstPersonCamera.parent).toBeNull();
        vehicleTransform.dispose();
    });

    it("aligns the camera to successive up directions without refreshing matrices", () => {
        const controls = new VehicleControls(scene);
        const transform = controls.thirdPersonCamera.parent;
        if (!(transform instanceof TransformNode)) {
            throw new Error("Expected a camera transform");
        }
        transform.rotationQuaternion = Quaternion.RotationAxis(Vector3.UpReadOnly, 0.7);
        const rotation = transform.rotationQuaternion;
        transform.computeWorldMatrix(true);

        controls.setUpDirection(Vector3.RightReadOnly);
        controls.setUpDirection(Vector3.DownReadOnly);
        transform.computeWorldMatrix(true);

        expect(transform.rotationQuaternion).toBe(rotation);
        expect(transform.up.equalsWithEpsilon(Vector3.DownReadOnly, 1e-6)).toBe(true);
        expect(rotation.asArray().every(Number.isFinite)).toBe(true);
    });
});
