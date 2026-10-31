//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { VolumetricLight } from "./volumetricLight";
import { VolumetricLightUniforms } from "./volumetricLightUniforms";

describe("VolumetricLight", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let light: VolumetricLight;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("camera", Vector3.Zero(), scene);
        scene.activeCamera = camera;
        light = new VolumetricLight(new Mesh("star", scene), new VolumetricLightUniforms(), [], scene);
    });

    afterEach(() => {
        light.dispose(camera);
        scene.dispose();
        engine.dispose();
    });

    it("allocates half-float textures for the scene input and scattering pass", () => {
        light.resize(64, 64, camera);

        expect(light.inputTexture.texture?.type).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
        expect(light.getPass().textureType).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
    });
});
