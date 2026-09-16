import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPad } from "../assets/procedural/spaceStation/landingPad/landingPad";
import type { OrbitalObject } from "../universe/architecture/orbitalObject";
import { LandingPadSize } from "../universe/orbitalFacility/landingPadManager";
import { createLandingPadTargets, createOrbitalObjectTarget, createTargetContact } from "./createTargets";
import { TargetType } from "./target";
import { TargetAcquisition } from "./targetContact";

describe("target factories and mission knowledge", () => {
    let engine: NullEngine;
    let scene: Scene;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it.each([
        [TargetType.CUSTOM, TargetAcquisition.KNOWN],
        [TargetType.STAR_SYSTEM, TargetAcquisition.KNOWN],
        [TargetType.SPACESHIP, TargetAcquisition.KNOWN],
        [TargetType.VEHICLE, TargetAcquisition.KNOWN],
        [TargetType.LANDING_BAY, TargetAcquisition.SENSOR],
        [TargetType.SPACE_ELEVATOR_CLIMBER, TargetAcquisition.SENSOR],
    ] as const)("classifies %s as %s", (type, acquisition) => {
        const transform = new TransformNode(type, scene);
        const target = { type, getTransform: (): TransformNode => transform, getBoundingRadius: (): number => 10 };
        const contact = createTargetContact(target);
        expect(contact.acquisition).toBe(acquisition);
    });

    it("gives pads semantic identifiers independent of transform names", () => {
        const transform = new TransformNode("unrelated mesh name", scene);
        const pad = {
            getIdentifier: (): string => "3",
            getTransform: (): TransformNode => transform,
            getBoundingRadius: (): number => 20,
            getPadSize: (): LandingPadSize => LandingPadSize.SMALL,
            getPadHeight: (): number => 0.5,
        };
        const targets = createLandingPadTargets(pad);
        expect(targets[0]?.padIdentifier).toBe("3");
        expect(targets.map(createTargetContact)[0]?.acquisition).toBe(TargetAcquisition.SENSOR);
    });

    it("stores the concrete pad identifier even if its transform is renamed", () => {
        const physics = vi.spyOn(LandingPad.prototype, "enablePhysics").mockImplementation(() => {});
        const material = new StandardMaterial("pad", scene);
        try {
            const pad = new LandingPad("7", LandingPadSize.SMALL, material, scene);
            pad.getTransform().name = "renamed";
            expect(pad.getIdentifier()).toBe("7");
            expect(createLandingPadTargets(pad)[0]?.padIdentifier).toBe("7");
            pad.dispose();
        } finally {
            physics.mockRestore();
            material.dispose();
        }
    });

    it.each(["darkKnight", "mengerSponge", "spaceStation"] as const)("creates a target for a %s", (type) => {
        const transform = new TransformNode(type, scene);
        const object = {
            type,
            model: { type, name: "Mission destination" },
            getTransform: (): TransformNode => transform,
            getBoundingRadius: (): number => 1,
        } as OrbitalObject;
        const primary = createOrbitalObjectTarget(object);
        if (type !== "spaceStation") {
            expect(primary).toMatchObject({ type: TargetType.ANOMALY });
        }
    });
});
