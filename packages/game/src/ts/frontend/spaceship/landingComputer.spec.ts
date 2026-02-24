import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { type PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type LandingPad } from "@/frontend/assets/procedural/spaceStation/landingPad/landingPad";

import { LandingComputer, LandingComputerStatusBit } from "./landingComputer";

// Mock BabylonJS classes
vi.mock("@babylonjs/core/Physics/v2/physicsAggregate", () => ({
    PhysicsAggregate: vi.fn(),
}));

vi.mock("@babylonjs/core/Physics/v2/physicsBody", () => ({
    PhysicsBody: vi.fn(),
}));

describe("LandingComputer", () => {
    let landingComputer: LandingComputer;
    let mockAggregate: PhysicsAggregate;
    let mockPhysicsEngine: PhysicsEngineV2;
    let mockTransform: TransformNode;
    let mockPhysicsBody: PhysicsBody;

    beforeEach(() => {
        // Setup mocks
        mockTransform = {
            getAbsolutePosition: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
            getHierarchyBoundingVectors: vi.fn().mockReturnValue({
                min: new Vector3(-1, -1, -1),
                max: new Vector3(1, 1, 1),
            }),
            absoluteRotationQuaternion: new Quaternion(),
            up: Vector3.Up(),
            right: Vector3.Right(),
            forward: Vector3.Forward(),
            position: new Vector3(0, 0, 0),
        } as unknown as TransformNode;

        mockPhysicsBody = {
            getLinearVelocity: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
            getAngularVelocity: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
            getMassProperties: vi.fn().mockReturnValue({ mass: 1 }),
            applyForce: vi.fn(),
            applyTorque: vi.fn(),
        } as unknown as PhysicsBody;

        mockAggregate = {
            transformNode: mockTransform,
            body: mockPhysicsBody,
        } as unknown as PhysicsAggregate;

        mockPhysicsEngine = {
            raycastToRef: vi.fn().mockImplementation((start, end, result: PhysicsRaycastResult) => {
                result.setHitData(Vector3.Up(), Vector3.Zero(), 0);
            }),
        } as unknown as PhysicsEngineV2;

        landingComputer = new LandingComputer(mockAggregate, mockPhysicsEngine);
    });

    it("should initialize with null target", () => {
        expect(landingComputer.getTarget()).toBeNull();
    });

    it("should set landing pad target", () => {
        const mockLandingPad = {
            getTransform: () => ({
                getAbsolutePosition: () => new Vector3(0, 10, 0),
                up: Vector3.Up(),
                absoluteRotationQuaternion: new Quaternion(),
            }),
            padHeight: 2,
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad: mockLandingPad,
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe("landing_pad");
    });

    it("should set celestial body target", () => {
        const mockCelestialBody = {
            position: new Vector3(0, 100, 0),
        } as unknown as TransformNode;

        landingComputer.setTarget({
            kind: "celestial_body",
            celestialBody: mockCelestialBody,
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe("celestial_body");
    });

    it("should return IDLE status when no target", () => {
        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.IDLE);
    });

    it("should timeout after max seconds", () => {
        const mockLandingPad = {
            getTransform: () => ({
                getAbsolutePosition: () => new Vector3(0, 10, 0),
                up: Vector3.Up(),
                absoluteRotationQuaternion: new Quaternion(),
            }),
            padHeight: 2,
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad: mockLandingPad,
        });

        // Simulate passage of time beyond timeout
        const status = landingComputer.update(91);
        expect(status).toBe(LandingComputerStatusBit.TIMEOUT);
        expect(landingComputer.getTarget()).toBeNull();
    });

    it("should report progress during normal operation", () => {
        const mockLandingPad = {
            getTransform: () => ({
                getAbsolutePosition: () => new Vector3(0, 10, 0),
                up: Vector3.Up(),
                absoluteRotationQuaternion: new Quaternion(),
            }),
            padHeight: 2,
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad: mockLandingPad,
        });

        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.PROGRESS);
    });
});
