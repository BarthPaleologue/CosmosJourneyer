import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPad } from "../../presentation/assets/procedural/spaceStation/landingPad/landingPad";
import { LandingPadSize } from "../../simulation/orbitalFacility/landingPadManager";
import { createLandingPadTargets } from "./createTargets";

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
});
