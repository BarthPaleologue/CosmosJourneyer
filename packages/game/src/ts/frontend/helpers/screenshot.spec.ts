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

import { describe, expect, it } from "vitest";

import packageInfo from "../../../../package.json";
import { addScreenshotMetadata, createScreenshotMetadata, dataUrlToBytes, readScreenshotMetadata } from "./screenshot";

const minimalPng = new Uint8Array([
    // PNG signature
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    // IEND chunk length: 0 bytes
    0x00, 0x00, 0x00, 0x00,
    // IEND chunk type
    0x49, 0x45, 0x4e, 0x44,
    // IEND CRC
    0xae, 0x42, 0x60, 0x82,
]);

const relativeLocation = {
    type: "relative",
    universeObjectId: {
        systemCoordinates: {
            starSectorX: 1,
            starSectorY: 2,
            starSectorZ: 3,
            localX: 0.4,
            localY: 0.5,
            localZ: -0.4,
        },
        idInSystem: "star0",
    },
    position: { x: 7, y: 8, z: 9 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
} as const;

describe("screenshot helpers", () => {
    it("uses the package version in screenshot metadata", () => {
        const capturedAt = new Date("2026-05-09T17:00:00.000Z");

        const metadata = createScreenshotMetadata(relativeLocation, capturedAt);

        expect(metadata.schemaVersion).toBe(1);
        expect(metadata.gameVersion).toBe(packageInfo.version);
        expect(metadata.capturedAt).toBe("2026-05-09T17:00:00.000Z");
    });

    it("adds and reads screenshot metadata before IEND", () => {
        const metadata = createScreenshotMetadata(relativeLocation, new Date("2026-05-09T17:00:00.000Z"));

        const png = addScreenshotMetadata(minimalPng, metadata);
        const metadataResult = readScreenshotMetadata(png);

        expect(png.length).toBeGreaterThan(minimalPng.length);
        expect(metadataResult).toEqual({ success: true, value: metadata });
    });

    it("returns null when a PNG has no screenshot metadata", () => {
        expect(readScreenshotMetadata(minimalPng)).toEqual({ success: true, value: null });
    });

    it("decodes base64 PNG data URLs", () => {
        let binary = "";
        for (const byte of minimalPng) {
            binary += String.fromCharCode(byte);
        }

        const bytes = dataUrlToBytes(`data:image/png;base64,${btoa(binary)}`);

        expect(bytes).toEqual(minimalPng);
    });
});
