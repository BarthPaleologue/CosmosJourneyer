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
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterAll, describe, expect, it } from "vitest";

import type { Vehicle } from "./vehicle";
import { VehicleControls } from "./vehicleControls";

describe("VehicleControls", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    afterAll(() => {
        scene.dispose();
        engine.dispose();
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
});
