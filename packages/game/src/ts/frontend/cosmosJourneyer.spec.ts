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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { makeScreenshotPng } from "@/frontend/helpers/screenshot";
import { Player } from "@/frontend/player/player";

import { CosmosJourneyer } from "./cosmosJourneyer";

vi.mock("@/frontend/helpers/screenshot", () => ({
    bytesToDataUrl: vi.fn(() => "data:image/png;base64,thumbnail"),
    downloadPng: vi.fn(),
    makeScreenshotPng: vi.fn(),
}));

describe("CosmosJourneyer", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("snapshots the player before awaiting thumbnail creation", async () => {
        const systemModel = getLoneStarSystem();
        const universeBackend = new UniverseBackend(systemModel);
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

        const spaceship = {
            id: serializedSpaceship.id,
            isLandedAtFacility: () => false,
        };
        const context = {
            activeView: {
                getMainScene: () => ({ activeCamera: {} }),
            },
            engine: {},
            getCurrentUniverseCoordinates: () => ({
                type: "relative",
                universeObjectId: {
                    systemCoordinates: systemModel.coordinates,
                    idInSystem: stellarObject.id,
                },
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
            }),
            player,
            starSystemView: {
                getSpaceshipControls: () => ({
                    getSpaceship: () => spaceship,
                    getTransform: () => ({}),
                }),
            },
        } as unknown as CosmosJourneyer;

        const savePromise = CosmosJourneyer.prototype.generateSaveData.call(context);

        player.serializedSpaceships.length = 0;
        player.tutorials.flightCompleted = true;
        resolveScreenshot?.(new Uint8Array());

        const save = await savePromise;
        expect(save.player.spaceShips).toEqual([serializedSpaceship]);
        expect(save.player.tutorials.flightCompleted).toBe(false);
    });
});
