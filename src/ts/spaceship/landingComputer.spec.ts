import { describe, it, expect, beforeEach, vi } from "vitest";
import { LandingComputer, LandingTargetKind, LandingComputerStatusBit } from "./landingComputer";
import { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";

// Mock BabylonJS classes
vi.mock("@babylonjs/core/Physics/v2/physicsAggregate", () => ({
    PhysicsAggregate: vi.fn()
}));

vi.mock("@babylonjs/core/Physics/v2/physicsBody", () => ({
    PhysicsBody: vi.fn()
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
                max: new Vector3(1, 1, 1)
            }),
            absoluteRotationQuaternion: new Quaternion(),
            up: Vector3.Up(),
            position: new Vector3(0, 0, 0)
        } as unknown as TransformNode;

        mockPhysicsBody = {
            getLinearVelocity: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
            getAngularVelocity: vi.fn().mockReturnValue(new Vector3(0, 0, 0)),
            getMassProperties: vi.fn().mockReturnValue({ mass: 1 }),
            applyForce: vi.fn(),
            applyAngularImpulse: vi.fn()
        } as unknown as PhysicsBody;

        mockAggregate = {
            transformNode: mockTransform,
            body: mockPhysicsBody
        } as unknown as PhysicsAggregate;

        mockPhysicsEngine = {
            raycastToRef: vi.fn().mockImplementation((start, end, result) => {
                result.hasHit = true;
                result.hitPointWorld = new Vector3(0, 0, 0);
                result.hitNormalWorld = Vector3.Up();
            })
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
                absoluteRotationQuaternion: new Quaternion()
            }),
            padHeight: 2
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: LandingTargetKind.LANDING_PAD,
            landingPad: mockLandingPad
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe(LandingTargetKind.LANDING_PAD);
    });

    it("should set celestial body target", () => {
        const mockCelestialBody = {
            position: new Vector3(0, 100, 0)
        } as unknown as TransformNode;

        landingComputer.setTarget({
            kind: LandingTargetKind.CELESTIAL_BODY,
            celestialBody: mockCelestialBody
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe(LandingTargetKind.CELESTIAL_BODY);
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
                absoluteRotationQuaternion: new Quaternion()
            }),
            padHeight: 2
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: LandingTargetKind.LANDING_PAD,
            landingPad: mockLandingPad
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
                absoluteRotationQuaternion: new Quaternion()
            }),
            padHeight: 2
        } as unknown as LandingPad;

        landingComputer.setTarget({
            kind: LandingTargetKind.LANDING_PAD,
            landingPad: mockLandingPad
        });

        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.PROGRESS);
    });
});
