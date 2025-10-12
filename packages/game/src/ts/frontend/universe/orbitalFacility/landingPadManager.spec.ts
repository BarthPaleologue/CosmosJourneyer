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

import { TransformNode } from "@babylonjs/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ObjectTargetCursorType, type TargetInfo } from "@/frontend/universe/architecture/targetable";

import { LandingPadManager, LandingPadSize, type ILandingPad, type LandingRequest } from "./landingPadManager";

vi.mock("@babylonjs/core");

// Mock LandingPad implementation for testing
class MockLandingPad implements ILandingPad {
    private readonly padSize: LandingPadSize;
    private readonly padNumber: number;

    private static PAD_NUMBER = 0;

    readonly targetInfo: TargetInfo = {
        type: ObjectTargetCursorType.LANDING_PAD,
        minDistance: 0,
        maxDistance: 0,
    };

    private readonly transform = new TransformNode("mockLandingPadTransform");

    constructor(padSize: LandingPadSize) {
        this.padSize = padSize;
        this.padNumber = MockLandingPad.PAD_NUMBER++;
    }

    getPadNumber(): number {
        return this.padNumber;
    }

    getTypeName(): string {
        return "MockLandingPad";
    }

    getPadSize(): LandingPadSize {
        return this.padSize;
    }

    getPadHeight(): number {
        return 0;
    }

    setLightsColor(): void {
        // No-op for testing
    }

    // Implement other required LandingPad methods with minimal functionality
    getTransform() {
        return this.transform;
    }
    dispose() {
        this.transform.dispose();
    }
    getBoundingRadius() {
        return 0;
    }
}

describe("LandingPadManager", () => {
    let smallPad: ILandingPad;
    let mediumPad: ILandingPad;
    let largePad: ILandingPad;
    let allPads: ILandingPad[];
    let landingPadManager: LandingPadManager;

    beforeEach(() => {
        // Create fresh instances for each test
        smallPad = new MockLandingPad(LandingPadSize.SMALL);
        mediumPad = new MockLandingPad(LandingPadSize.MEDIUM);
        largePad = new MockLandingPad(LandingPadSize.LARGE);
        allPads = [smallPad, mediumPad, largePad];

        // Pass the array directly instead of a lambda
        landingPadManager = new LandingPadManager(allPads);
    });

    it("should return all landing pads", () => {
        expect(landingPadManager.getLandingPads()).toEqual(allPads);
        expect(landingPadManager.getLandingPads().length).toBe(3);
    });

    it("should initially return all landing pads as available", () => {
        expect(landingPadManager.getAvailableLandingPads()).toEqual(allPads);
        expect(landingPadManager.getAvailableLandingPads().length).toBe(3);
    });

    it("should handle landing request for small pad", () => {
        const request: LandingRequest = { minimumPadSize: LandingPadSize.SMALL };
        const assignedPad = landingPadManager.handleLandingRequest(request);

        // Should get smallest suitable pad (in this case, small)
        expect(assignedPad).toBe(smallPad);

        // The small pad should now be unavailable
        expect(landingPadManager.getAvailableLandingPads().length).toBe(2);
        expect(landingPadManager.getAvailableLandingPads()).not.toContain(smallPad);
    });

    it("should handle landing request for medium pad", () => {
        const request: LandingRequest = { minimumPadSize: LandingPadSize.MEDIUM };
        const assignedPad = landingPadManager.handleLandingRequest(request);

        // Should get smallest suitable pad (in this case, medium)
        expect(assignedPad).toBe(mediumPad);

        // The medium pad should now be unavailable
        expect(landingPadManager.getAvailableLandingPads().length).toBe(2);
        expect(landingPadManager.getAvailableLandingPads()).not.toContain(mediumPad);
    });

    it("should handle landing request for large pad", () => {
        const request: LandingRequest = { minimumPadSize: LandingPadSize.LARGE };
        const assignedPad = landingPadManager.handleLandingRequest(request);

        // Should get smallest suitable pad (in this case, large)
        expect(assignedPad).toBe(largePad);

        // The large pad should now be unavailable
        expect(landingPadManager.getAvailableLandingPads().length).toBe(2);
        expect(landingPadManager.getAvailableLandingPads()).not.toContain(largePad);
    });

    it("should return null when no suitable landing pad is available", () => {
        // Allocate all pads
        landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });
        landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.MEDIUM });
        landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.LARGE });

        // Try to allocate another pad
        const assignedPad = landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });

        expect(assignedPad).toBeNull();
    });

    it("should cancel landing request and make pad available again", () => {
        // Allocate a pad
        const request: LandingRequest = { minimumPadSize: LandingPadSize.MEDIUM };
        const assignedPad = landingPadManager.handleLandingRequest(request);
        if (assignedPad === null) {
            throw new Error("Assigned pad is null");
        }

        expect(landingPadManager.getAvailableLandingPads().length).toBe(2);

        // Cancel the request
        landingPadManager.cancelLandingRequest(assignedPad);

        // The pad should be available again
        expect(landingPadManager.getAvailableLandingPads().length).toBe(3);
        expect(landingPadManager.getAvailableLandingPads()).toContain(assignedPad);
    });

    it("should prioritize smallest suitable pad", () => {
        // Request a pad that's at least medium
        const request: LandingRequest = { minimumPadSize: LandingPadSize.MEDIUM };

        // Should get medium pad, not large
        const assignedPad = landingPadManager.handleLandingRequest(request);
        expect(assignedPad).toBe(mediumPad);
        if (assignedPad !== mediumPad) {
            throw new Error("Assigned pad is not the expected medium pad");
        }

        // Make medium unavailable
        landingPadManager.cancelLandingRequest(assignedPad);

        // Now make both small and medium unavailable
        landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });
        landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.MEDIUM });

        // Now if we request medium again, we should get large since it's the only suitable one left
        const newAssignedPad = landingPadManager.handleLandingRequest({ minimumPadSize: LandingPadSize.MEDIUM });
        expect(newAssignedPad).toBe(largePad);
    });
});
