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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { makeScreenshotPng } from "@/frontend/helpers/screenshot";
import { Player } from "@/frontend/player/player";
import type { View } from "@/frontend/view";

import { CosmosJourneyer } from "./cosmosJourneyer";

/**
 * Builds a fresh per-test object inheriting the class prototype, narrowed by a runtime
 * instanceof check so no type assertion is needed and the shared class prototype stays untouched.
 * @param fields State and method overrides placed on the fresh object.
 * @returns A per-test instance of the class, narrowed by a runtime instanceof check.
 */
function createCosmosJourneyer(fields: Record<string, unknown>): CosmosJourneyer {
    const candidate: unknown = Object.setPrototypeOf(fields, CosmosJourneyer.prototype);
    if (!(candidate instanceof CosmosJourneyer)) {
        throw new Error("unreachable: candidate inherits CosmosJourneyer.prototype");
    }

    return candidate;
}

vi.mock("@/frontend/helpers/screenshot", () => ({
    bytesToDataUrl: vi.fn(() => "data:image/png;base64,thumbnail"),
    downloadPng: vi.fn(),
    makeScreenshotPng: vi.fn(),
}));

describe("CosmosJourneyer", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        vi.clearAllMocks();
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.activeCamera = new FreeCamera("camera", Vector3.Zero(), scene);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each([false, true])(
        "snapshots the player and docking location before thumbnail creation (docked: %s)",
        async (docked) => {
            const systemModel = getLoneStarSystem().system;
            const universeBackend = new UniverseBackend(new SystemEntityBackend());
            const player = Player.Default(universeBackend);
            const serializedSpaceship = player.serializedSpaceships[0];
            const stellarObject = systemModel.stellarObjects[0];
            if (serializedSpaceship === undefined) {
                throw new Error("Default player has no spaceship");
            }

            let resolveScreenshot: ((value: Uint8Array) => void) | undefined;
            const screenshotPromise = new Promise<Uint8Array>((resolve) => {
                resolveScreenshot = resolve;
            });
            vi.mocked(makeScreenshotPng).mockReturnValue(screenshotPromise);

            const shipTransform = new TransformNode("ship", scene);
            const spaceship = {
                id: serializedSpaceship.id,
                isLandedAtFacility: (): boolean => docked,
            };
            const activeView: View = {
                render: () => {},
                detachControl: () => {},
                attachControl: () => {},
                getMainScene: () => scene,
            };
            const context = createCosmosJourneyer({
                activeView,
                engine,
                player,
                starSystemView: {
                    getCurrentUniverseCoordinates: () => ({
                        type: "relative",
                        universeObjectId: {
                            systemCoordinates: systemModel.coordinates,
                            idInSystem: stellarObject.id,
                        },
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0, w: 1 },
                    }),
                    getSpaceshipControls: () => ({
                        getSpaceship: () => spaceship,
                        getTransform: () => shipTransform,
                        getLandingFacility: () => (docked ? { id: "module-station" } : null),
                    }),
                },
            });

            const savePromise = context.generateSaveData();

            player.serializedSpaceships.length = 0;
            player.tutorials.flightCompleted = true;
            resolveScreenshot?.(new Uint8Array());

            const save = await savePromise;
            const location = save.shipLocations[spaceship.id];
            if (location?.type !== "relative" && location?.type !== "atStation") {
                throw new Error("Expected a saved object location");
            }
            expect(location.universeObjectId.idInSystem).toBe(docked ? "module-station" : stellarObject.id);
            expect(location.type).toBe(docked ? "atStation" : "relative");
            expect(save.player.spaceShips).toEqual([serializedSpaceship]);
            expect(save.player.tutorials.flightCompleted).toBe(false);
        },
    );
});
