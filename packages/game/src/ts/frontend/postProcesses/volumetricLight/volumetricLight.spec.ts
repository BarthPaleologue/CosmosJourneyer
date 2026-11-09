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

import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VolumetricLight } from "./volumetricLight";
import { VolumetricLightUniforms } from "./volumetricLightUniforms";

describe("VolumetricLight render target lifecycle", () => {
    let engine: NullEngine;
    let scene: Scene;
    let camera: FreeCamera;
    let light: VolumetricLight;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        camera = new FreeCamera("ship", Vector3.Zero(), scene);
        scene.activeCamera = camera;
        light = new VolumetricLight(new Mesh("star", scene), new VolumetricLightUniforms(), [], scene);
    });

    afterEach(() => {
        light.dispose(camera);
        scene.dispose();
        engine.dispose();
    });

    it("moves the shared pass to existing and newly added cameras without duplicates", async () => {
        const pass = light.getPass();
        expect(scene.customRenderTargets).not.toContain(pass);
        expect(camera.customRenderTargets).toEqual([pass]);
        const character = new FreeCamera("character", Vector3.Zero(), scene);
        await vi.waitFor(() => {
            expect(character.customRenderTargets.includes(pass)).toBe(true);
        });
        scene.onNewCameraAddedObservable.notifyObservers(character);
        expect(character.customRenderTargets).toEqual([pass]);
        expect(pass.activeCamera).toBeUndefined();
        expect(pass.renderList).toBeNull();
    });

    it("cleans every camera and stops registering after repeated disposal and recreation", async () => {
        const character = new FreeCamera("character", Vector3.Zero(), scene);
        const pass = light.getPass();
        await vi.waitFor(() => {
            expect(character.customRenderTargets.includes(pass)).toBe(true);
        });
        light.dispose(camera);
        light.dispose(character);
        expect(scene.customRenderTargets).not.toContain(pass);
        expect(camera.customRenderTargets).not.toContain(pass);
        expect(character.customRenderTargets).not.toContain(pass);
        const vehicle = new FreeCamera("vehicle", Vector3.Zero(), scene);
        await new Promise<void>((resolve) => {
            scene.onNewCameraAddedObservable.addOnce(() => {
                resolve();
            });
        });
        expect(vehicle.customRenderTargets).toEqual([]);
        const replacement = new VolumetricLight(new Mesh("next star", scene), new VolumetricLightUniforms(), [], scene);
        for (const sceneCamera of scene.cameras) {
            expect(sceneCamera.customRenderTargets).toEqual([replacement.getPass()]);
        }
        replacement.dispose(vehicle);
    });

    it("allocates half-float textures for the scene input and scattering pass", () => {
        light.resize(64, 64, camera);

        expect(light.inputTexture.texture?.type).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
        expect(light.getPass().textureType).toBe(Constants.TEXTURETYPE_HALF_FLOAT);
    });
});
