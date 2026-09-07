import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { initI18n } from "../../../i18n";
import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";
import { getTargetCursorAppearance, getTargetDisplayName, getTargetTypeName } from "./targetAppearance";

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

    it.each([
        ["en-US", "Pad 3", "Landing Pad"],
        ["fr-FR", "Plateforme 3", "Plateforme d'Atterrissage"],
    ])("localizes a pad identifier and its generic type in %s", async (lng, name, typeName) => {
        const target: Target = { ...targetGeometry, type: TargetType.LANDING_PAD, padIdentifier: "3" };
        const language = vi.spyOn(navigator, "language", "get").mockReturnValue(lng);
        try {
            const localizedT = await initI18n();
            expect(getTargetDisplayName(target, localizedT)).toBe(name);
            expect(getTargetTypeName(target, localizedT)).toBe(typeName);
        } finally {
            language.mockRestore();
        }
    });

    it("keeps the stellar classification as semantic target data", () => {
        const target: Target = { ...targetGeometry, type: TargetType.STAR, stellarType: "G" };

        expect(getTargetTypeName(target, t)).toBe("G Star");
    });

    it("keeps satellite cursor appearance geometric", () => {
        const target: Target = {
            ...targetGeometry,
            type: TargetType.TELLURIC_SATELLITE,
            orbitSemiMajorAxis: 2_000,
        };

        expect(getTargetCursorAppearance(target)).toEqual({
            shape: "rounded",
            minSize: 5,
            maxSize: 0,
        });
    });
});

const targetGeometry = {
    getTransform: (): TransformNode => {
        throw new Error("The transform is not used by target presentation tests");
    },
    getBoundingRadius: (): number => 10,
};
