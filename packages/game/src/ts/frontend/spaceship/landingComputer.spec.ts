import "@babylonjs/core/Physics/physicsEngineComponent";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { meters } from "@cosmos-journeyer/physics";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createHavokForTests } from "@/frontend/helpers/havokTest";
import { LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadProvider";

import { getPhysicsEngineV2 } from "@/utils/physicsEngineV2";

import { AttitudePDController } from "./attitudePdController";
import { LandingComputer, LandingComputerStatusBit } from "./landingComputer";

describe("LandingComputer", () => {
    let havok: HavokPhysicsWithBindings;
    let engine: NullEngine;
    let scene: Scene;
    let physicsEngine: PhysicsEngineV2;
    let shipTransform: TransformNode;
    let aggregate: PhysicsAggregate;
    let landingComputer: LandingComputer;

    beforeAll(async () => {
        havok = await createHavokForTests();
    });

    beforeEach(() => {
        // Setup a real scene with the Havok physics engine
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
        physicsEngine = getPhysicsEngineV2(scene);

        shipTransform = new TransformNode("ship", scene);
        shipTransform.rotationQuaternion = Quaternion.Identity();
        // A size-2 hull gives the ship the same (-1, -1, -1)..(1, 1, 1) hierarchy bounds as the fixture
        const hull = CreateBox("shipHull", { size: 2 }, scene);
        hull.parent = shipTransform;

        aggregate = new PhysicsAggregate(shipTransform, PhysicsShapeType.BOX, { mass: 1 }, scene);

        vi.spyOn(physicsEngine, "raycastToRef").mockImplementation((from, to, result) => {
            if (!Array.isArray(result)) {
                result.setHitData(Vector3.Up(), Vector3.Zero(), 0);
            }
        });

        landingComputer = new LandingComputer(aggregate, physicsEngine);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        scene.dispose();
        engine.dispose();
    });

    /**
     * @returns A landing pad backed by a real transform node at (0, 10, 0) with identity rotation.
     */
    function createLandingPad(): ILandingPad {
        const padTransform = new TransformNode("landingPad", scene);
        padTransform.rotationQuaternion = Quaternion.Identity();
        padTransform.position.set(0, 10, 0);
        return {
            getTransform: () => padTransform,
            getBoundingRadius: () => meters(10),
            getIdentifier: () => "landingPad",
            getPadSize: () => LandingPadSize.SMALL,
            getPadHeight: () => meters(2),
        };
    }

    it("should initialize with null target", () => {
        expect(landingComputer.getTarget()).toBeNull();
    });

    it("should set landing pad target", () => {
        const landingPad = createLandingPad();

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad,
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe("landing_pad");
    });

    it("should set celestial body target", () => {
        const celestialBody = new TransformNode("celestialBody", scene);
        celestialBody.position.set(0, 100, 0);

        landingComputer.setTarget({
            kind: "celestial_body",
            celestialBody,
        });

        expect(landingComputer.getTarget()).not.toBeNull();
        expect(landingComputer.getTarget()?.kind).toBe("celestial_body");
    });

    it("should return IDLE status when no target", () => {
        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.IDLE);
    });

    it("should timeout after max seconds", () => {
        const landingPad = createLandingPad();

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad,
        });

        // Simulate passage of time beyond timeout
        const status = landingComputer.update(91);
        expect(status).toBe(LandingComputerStatusBit.TIMEOUT);
        expect(landingComputer.getTarget()).toBeNull();
    });

    it("should report progress during normal operation", () => {
        const landingPad = createLandingPad();

        landingComputer.setTarget({
            kind: "landing_pad",
            landingPad,
        });

        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.PROGRESS);
    });

    it("should run liftoff without a landing target", () => {
        landingComputer.liftOff();

        expect(landingComputer.getTarget()).toBeNull();
        expect(landingComputer.isActive()).toBe(true);

        const status = landingComputer.update(0.016);
        expect(status).toBe(LandingComputerStatusBit.PROGRESS);
    });

    it("plans a finite surface landing when the ship is upside down", () => {
        shipTransform.rotationQuaternion = Quaternion.RotationAxis(Vector3.RightReadOnly, Math.PI);
        shipTransform.position.set(0, 100, 0);
        const computeTorque = vi.spyOn(AttitudePDController.prototype, "computeTorqueToRef");

        try {
            const celestialBody = new TransformNode("celestialBody", scene);
            celestialBody.position.set(0, -100, 0);
            landingComputer.setTarget({
                kind: "celestial_body",
                celestialBody,
            });
            const status = landingComputer.update(0.016);
            const targetRotation = computeTorque.mock.lastCall?.[1].orientation;
            if (targetRotation === undefined) {
                throw new Error("Expected a target rotation for the surface landing");
            }

            expect(status).toBe(LandingComputerStatusBit.PROGRESS);
            expect(targetRotation.asArray().every(Number.isFinite)).toBe(true);
            expect(Vector3.Up().applyRotationQuaternion(targetRotation).y).toBeCloseTo(1);
        } finally {
            computeTorque.mockRestore();
        }
    });

    it("should timeout liftoff without a landing target", () => {
        landingComputer.liftOff();

        const status = landingComputer.update(91);
        expect(status).toBe(LandingComputerStatusBit.TIMEOUT);
        expect(landingComputer.getTarget()).toBeNull();
        expect(landingComputer.isActive()).toBe(false);
    });
});
