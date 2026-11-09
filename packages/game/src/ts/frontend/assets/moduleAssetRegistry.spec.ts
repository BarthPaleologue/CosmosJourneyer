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

import type { AssetContainer } from "@babylonjs/core/assetContainer";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

import { LoadingProgressMonitor } from "./loadingProgressMonitor";
import { ModuleAssetRegistry } from "./moduleAssetRegistry";

/**
 * @returns A fake container paired with its disposal spy.
 */
function createContainer(): { container: AssetContainer; dispose: Mock<() => void> } {
    const dispose = vi.fn<() => void>();
    return {
        container: { dispose } as unknown as AssetContainer,
        dispose,
    };
}

/**
 * @param container Container returned by the loader.
 * @returns An asynchronous loader for the given container.
 */
function createLoader(container: AssetContainer): (scene: Scene) => Promise<AssetContainer> {
    return async (scene) => {
        await Promise.resolve(scene);
        return container;
    };
}

describe("ModuleAssetRegistry", () => {
    let engine: NullEngine;
    let scene: Scene;
    let progressMonitor: LoadingProgressMonitor;
    let registry: ModuleAssetRegistry;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        progressMonitor = new LoadingProgressMonitor();
        registry = new ModuleAssetRegistry();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("registers a loader without running it", () => {
        const loader = vi.fn(createLoader(createContainer().container));

        registry.registerContainer("module/asset", loader);

        expect(loader).not.toHaveBeenCalled();
    });

    it("returns every loaded container keyed by identifier", async () => {
        const first = createContainer();
        const second = createContainer();
        registry.registerContainer("module/first", createLoader(first.container));
        registry.registerContainer("module/second", createLoader(second.container));

        const result = await registry.load(scene, progressMonitor);

        expect(result.success).toBe(true);
        if (!result.success) {
            return;
        }
        expect(result.value.getContainer("module/first")).toBe(first.container);
        expect(result.value.getContainer("module/second")).toBe(second.container);
        expect(result.value.getContainer("module/unknown")).toBeUndefined();
    });

    it("runs every loader with the load scene", async () => {
        const loader = vi.fn(createLoader(createContainer().container));
        registry.registerContainer("module/asset", loader);

        await registry.load(scene, progressMonitor);

        expect(loader).toHaveBeenCalledOnce();
        expect(loader).toHaveBeenCalledWith(scene);
    });

    it("refuses duplicate identifiers", () => {
        const loader = createLoader(createContainer().container);
        registry.registerContainer("module/asset", loader);

        expect(() => {
            registry.registerContainer("module/asset", loader);
        }).toThrow(/already registered/);
    });

    it("propagates loading errors", async () => {
        registry.registerContainer("module/broken", async () => {
            await Promise.resolve();
            throw new Error("import failed");
        });

        const result = await registry.load(scene, progressMonitor);

        expect(result.success).toBe(false);
        if (result.success) {
            return;
        }
        expect(result.error.message).toContain("module/broken");
        expect(result.error.cause).toBeInstanceOf(Error);
    });

    it("disposes successfully loaded containers after a partial failure", async () => {
        const loaded = createContainer();
        let shouldFail = true;
        const failingLoader = async (): Promise<AssetContainer> => {
            await Promise.resolve();
            if (shouldFail) {
                throw new Error("import failed");
            }
            return createContainer().container;
        };
        registry.registerContainer("module/loaded", createLoader(loaded.container));
        registry.registerContainer("module/failing", failingLoader);

        const failedResult = await registry.load(scene, progressMonitor);

        expect(failedResult.success).toBe(false);
        expect(loaded.dispose).toHaveBeenCalledOnce();

        shouldFail = false;
        const retryResult = await registry.load(scene, progressMonitor);

        expect(retryResult.success).toBe(true);
        if (!retryResult.success) {
            return;
        }
        expect(retryResult.value.getContainer("module/loaded")).toBeDefined();
        expect(retryResult.value.getContainer("module/failing")).toBeDefined();
    });

    it("returns an asset set that disposes its containers", async () => {
        const loaded = createContainer();
        registry.registerContainer("module/asset", createLoader(loaded.container));

        const result = await registry.load(scene, progressMonitor);

        expect(result.success).toBe(true);
        if (!result.success) {
            return;
        }
        expect(result.value.getContainer("module/asset")).toBe(loaded.container);
        result.value.dispose();
        expect(loaded.dispose).toHaveBeenCalledOnce();
        expect(result.value.getContainer("module/asset")).toBeUndefined();
    });

    it("tracks loading progress per container", async () => {
        const progressUpdates: Array<[number, number]> = [];
        progressMonitor.addProgressCallback((started, completed) => {
            progressUpdates.push([started, completed]);
        });
        registry.registerContainer("module/first", createLoader(createContainer().container));
        registry.registerContainer("module/second", createLoader(createContainer().container));

        await registry.load(scene, progressMonitor);

        expect(progressUpdates).toContainEqual([2, 0]);
        expect(progressUpdates).toContainEqual([2, 1]);
        expect(progressUpdates.at(-1)).toEqual([2, 2]);
    });
});
