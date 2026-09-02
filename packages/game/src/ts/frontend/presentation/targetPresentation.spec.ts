import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it } from "vitest";

import { initI18n } from "../../i18n";
import { TargetType } from "../gameplay/targetable";
import type { Target } from "../gameplay/targetable";
import { getTargetCursorAppearance, getTargetDisplayName, getTargetTypeName } from "./targetPresentation";

describe("target presentation", () => {
    let t: TFunction;

    beforeAll(async () => {
        t = await initI18n();
    });

    it("uses the proper name without translating it", () => {
        const target: Target = { ...targetGeometry, type: TargetType.SPACESHIP, properName: "Odyssey" };

        expect(getTargetDisplayName(target, t)).toBe("Odyssey");
    });

    it("localizes the target type when no proper name exists", () => {
        const target: Target = { ...targetGeometry, type: TargetType.LANDING_BAY };

        expect(getTargetDisplayName(target, t)).toBe("Landing Bay");
    });

    it("keeps the stellar classification as semantic target data", () => {
        const target: Target = { ...targetGeometry, type: TargetType.STAR, stellarType: "G" };

        expect(getTargetTypeName(target, t)).toBe("G Star");
    });

    it("derives satellite cursor visibility from its semantic orbit", () => {
        const target: Target = {
            ...targetGeometry,
            type: TargetType.TELLURIC_SATELLITE,
            orbitSemiMajorAxis: 2_000,
        };

        expect(getTargetCursorAppearance(target)).toMatchObject({
            minDistance: 100,
            maxDistance: 16_000,
        });
    });
});

const targetGeometry = {
    getTransform: (): TransformNode => {
        throw new Error("The transform is not used by target presentation tests");
    },
    getBoundingRadius: (): number => 10,
};
