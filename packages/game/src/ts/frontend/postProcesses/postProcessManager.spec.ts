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
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DepthRendererManager } from "../helpers/depthRendererManager";
import { PostProcessManager } from "./postProcessManager";

describe("PostProcessManager lens flare lifecycle", () => {
    let engine: NullEngine;
    let scene: Scene;
    let pilot: FreeCamera;
    let observer: FreeCamera;
    let manager: PostProcessManager;
    let depthRendererManager: DepthRendererManager;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        pilot = new FreeCamera("pilot", Vector3.Zero(), scene);
        observer = new FreeCamera("observer", Vector3.Zero(), scene);
        depthRendererManager = new DepthRendererManager(scene);
        manager = new PostProcessManager(depthRendererManager, scene);
    });

    afterEach(() => {
        manager.reset();
        depthRendererManager.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("keeps one shared pass across empty and loaded star systems", async () => {
        const flarePasses = (camera: FreeCamera) => camera._postProcesses.filter((pass) => pass?.name === "lensFlare");
        const [flare] = flarePasses(pilot);
        if (flare === undefined || flare === null) {
            throw new Error("Expected a lens flare pass before loading a system");
        }
        expect(flarePasses(pilot)).toEqual([flare]);
        expect(flarePasses(observer)).toEqual([flare]);
        const updateEffect = vi.spyOn(flare, "updateEffect");

        const firstSource = {
            transform: new TransformNode("first", scene),
            boundingRadius: 3,
            color: Color3.White(),
        };
        const secondSource = { ...firstSource, transform: new TransformNode("second", scene) };
        firstSource.transform.position.z = 30;
        secondSource.transform.position.z = 60;
        scene.setTransformMatrix(pilot.getViewMatrix(), pilot.getProjectionMatrix());
        flare.onActivateObservable.notifyObservers(pilot);

        manager.addCelestialBodies(
            [],
            { getLights: () => [], getLensFlareSources: () => [firstSource, secondSource] },
            [],
        );
        expect(flarePasses(pilot)).toEqual([flare]);
        expect(flarePasses(observer)).toEqual([flare]);
        expect(updateEffect).toHaveBeenCalledExactlyOnceWith("#define LENS_FLARE_SOURCE_CAPACITY 2");
        const effect = flare.getEffect();
        await vi.waitFor(() => {
            expect(effect.isReady()).toBe(true);
        });
        const setInt = vi.spyOn(effect, "setInt");
        flare.onApplyObservable.notifyObservers(effect);
        expect(setInt).toHaveBeenLastCalledWith("visibleSourceCount", 2);

        manager.reset();
        expect(flarePasses(pilot)).toEqual([flare]);
        expect(flarePasses(observer)).toEqual([flare]);
        flare.onApplyObservable.notifyObservers(effect);
        expect(setInt).toHaveBeenLastCalledWith("visibleSourceCount", 0);

        manager.addCelestialBodies([], { getLights: () => [], getLensFlareSources: () => [secondSource] }, []);
        expect(flarePasses(pilot)).toEqual([flare]);
        expect(flarePasses(observer)).toEqual([flare]);
        expect(updateEffect).toHaveBeenCalledTimes(1);
        flare.onApplyObservable.notifyObservers(effect);
        expect(setInt).toHaveBeenLastCalledWith("visibleSourceCount", 1);
    });
});
