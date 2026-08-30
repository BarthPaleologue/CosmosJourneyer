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
import { ClusteredLightContainer } from "@babylonjs/core/Lights/Clustered/clusteredLightContainer";
import type { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ClusteredLightingRegion } from "@/frontend/universe/architecture/clusteredLightingRegion";

import { ClusteredLightingSystem } from "./clusteredLightingSystem";

describe("ClusteredLightingSystem", () => {
    let engine: NullEngine;
    let scene: Scene;
    let system: ClusteredLightingSystem | null;

    beforeEach(() => {
        engine = new NullEngine();
        engine._webGLVersion = 2;
        const caps = engine.getCaps();
        caps.texelFetch = true;
        caps.colorBufferFloat = true;
        caps.blendFloat = true;

        scene = new Scene(engine);
        system = new ClusteredLightingSystem(scene);
    });

    afterEach(() => {
        system?.dispose();
        scene.dispose();
        engine.dispose();
    });

    const getContainer = (): ClusteredLightContainer => {
        const container = scene.lights.find((light) => light instanceof ClusteredLightContainer);
        if (container === undefined) {
            throw new Error("Global clustered light container not found");
        }
        return container;
    };

    const createRegion = (name: string, lights: ReadonlyArray<Light>): ClusteredLightingRegion => {
        const transform = new TransformNode(`${name}Transform`, scene);
        return {
            getTransform: () => transform,
            getBoundingRadius: () => 1,
            getLights: () => lights,
        };
    };

    const createLight = (name: string): PointLight => {
        const light = new PointLight(name, Vector3.Zero(), scene, true);
        light.setEnabled(false);
        return light;
    };

    it("registers every light and enables it", () => {
        const lights = [createLight("first"), createLight("second")];
        const region = createRegion("station", lights);

        system?.registerRegion(region);

        expect(getContainer().lights).toEqual(lights);
        expect(lights.every((light) => light.isEnabled())).toBe(true);
    });

    it("does not register a region twice", () => {
        const light = createLight("light");
        const region = createRegion("station", [light]);

        system?.registerRegion(region);
        system?.registerRegion(region);

        expect(getContainer().lights).toEqual([light]);
    });

    it("unregisters every light, disables it, and ignores repeated unregisters", () => {
        const lights = [createLight("first"), createLight("second")];
        const region = createRegion("station", lights);
        system?.registerRegion(region);

        system?.unregisterRegion(region);
        system?.unregisterRegion(region);

        expect(getContainer().lights).toEqual([]);
        expect(lights.every((light) => !light.isEnabled())).toBe(true);
    });

    it("can register a region again after unregistering it", () => {
        const light = createLight("light");
        const region = createRegion("station", [light]);

        system?.registerRegion(region);
        system?.unregisterRegion(region);
        system?.registerRegion(region);

        expect(getContainer().lights).toEqual([light]);
        expect(light.isEnabled()).toBe(true);
    });

    it("keeps producer-owned lights alive when disposed", () => {
        const light = createLight("light");
        const region = createRegion("station", [light]);
        system?.registerRegion(region);

        system?.dispose();
        system = null;

        expect(light.isDisposed()).toBe(false);
        expect(light.isEnabled()).toBe(false);
        expect(scene.lights).toContain(light);
        expect(scene.lights.some((sceneLight) => sceneLight instanceof ClusteredLightContainer)).toBe(false);
    });

    it("shares one container between station and spaceship regions", () => {
        const stationLight = createLight("stationLight");
        const spaceshipLight = createLight("spaceshipLight");

        system?.registerRegion(createRegion("station", [stationLight]));
        system?.registerRegion(createRegion("spaceship", [spaceshipLight]));

        const containers = scene.lights.filter((light) => light instanceof ClusteredLightContainer);
        expect(containers).toHaveLength(1);
        expect(containers[0]?.lights).toEqual([stationLight, spaceshipLight]);
    });
});
