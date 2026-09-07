import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import type { UniverseObjectId } from "@cosmos-journeyer/universe-model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPad } from "../../presentation/assets/procedural/spaceStation/landingPad/landingPad";
import type { OrbitalObject } from "../../simulation/architecture/orbitalObject";
import { LandingPadSize } from "../../simulation/orbitalFacility/landingPadManager";
import {
    createLandingPadTargets,
    createOrbitalObjectTarget,
    createTargetContact,
    getMissionKnownTargets,
} from "./createTargets";
import { TargetType } from "./target";
import type { Target } from "./target";
import { TargetAcquisition } from "./targetContact";
import { TargetingSystem } from "./targetingSystem";

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
        if (type === TargetType.CUSTOM) {
            const system = new TargetingSystem();
            system.addContacts([contact]);
            for (const distance of [1, 1e12]) {
                transform.position.z = distance;
                expect(system.isAvailable(target)).toBe(true);
            }
        }
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

    it.each(["darkKnight", "mengerSponge", "spaceStation"] as const)("mission guidance exposes only its %s", (type) => {
        const transform = new TransformNode(type, scene);
        transform.position.z = 10000;
        // Only the primary object's geometry and model are needed; facility expansion would fail here.
        const object = {
            type,
            model: { type, name: "Mission destination" },
            getTransform: (): TransformNode => transform,
            getBoundingRadius: (): number => 1,
        } as OrbitalObject;
        const coordinates = { starSectorX: 0, starSectorY: 0, starSectorZ: 0, localX: 0, localY: 0, localZ: 0 };
        const mission = {
            getGuidanceTargetObjectIds: (): Array<UniverseObjectId> => [
                { systemCoordinates: coordinates, idInSystem: "mission-destination" },
            ],
        };
        const starSystem = { model: { coordinates }, getOrbitalObjectById: (): OrbitalObject => object };
        const primary = createOrbitalObjectTarget(object);
        if (type !== "spaceStation") {
            expect(primary).toMatchObject({ type: TargetType.ANOMALY });
        }
        const padTransform = new TransformNode("pad", scene);
        padTransform.position.z = 10000;
        const pad: Target = {
            type: TargetType.LANDING_PAD,
            padIdentifier: "1",
            getTransform: (): TransformNode => padTransform,
            getBoundingRadius: (): number => 1,
        };
        const system = new TargetingSystem();
        system.addContacts([primary, pad].map(createTargetContact));
        system.update(Vector3.Zero());
        expect(system.isAvailable(primary)).toBe(type === "spaceStation");
        const knownTargets = getMissionKnownTargets([mission], starSystem);
        expect(knownTargets).toHaveLength(1);
        system.setKnownTargets(knownTargets);
        expect(system.isKnown(primary)).toBe(true);
        expect(system.isAvailable(primary)).toBe(true);
        expect(system.getContact(primary)?.target).toBe(primary);
        expect([...system.getTargets()]).toHaveLength(2);
        expect(system.isKnown(pad)).toBe(false);
        expect(system.isAvailable(pad)).toBe(false);
        system.setKnownTargets(getMissionKnownTargets([], starSystem));
        expect(system.isKnown(primary)).toBe(type === "spaceStation");
    });
});
