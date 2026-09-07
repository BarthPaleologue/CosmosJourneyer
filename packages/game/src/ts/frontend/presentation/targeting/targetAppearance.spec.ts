import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import type { TFunction } from "i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { initI18n } from "../../../i18n";
import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";
import {
    getTargetCursorAppearance,
    getTargetCursorOpacity,
    getTargetDisplayName,
    getTargetTypeName,
} from "./targetAppearance";

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

    it("uses the same appearance and proximity fade for all anomalies", () => {
        const target: Target = { ...targetGeometry, type: TargetType.ANOMALY };
        expect(getTargetCursorAppearance(target).minSize).toBe(5);
        checkProximityFade(target, 100);
    });

    it.each([
        [TargetType.STAR, 100],
        [TargetType.NEUTRON_STAR, 100],
        [TargetType.BLACK_HOLE, 100],
        [TargetType.GAS_PLANET, 100],
        [TargetType.TELLURIC_PLANET, 100],
        [TargetType.TELLURIC_SATELLITE, 100],
        [TargetType.SPACE_STATION, 60],
        [TargetType.SPACE_ELEVATOR, 60],
        [TargetType.SPACE_ELEVATOR_CLIMBER, 70],
        [TargetType.LANDING_PAD, 40],
        [TargetType.LANDING_BAY, 8000],
        [TargetType.STAR_SYSTEM, lightYearsToMeters(2)],
        [TargetType.SPACESHIP, 150],
        [TargetType.VEHICLE, 100],
    ] as const)("preserves the original %s proximity fade", (type, minDistance) => {
        const target: Target = {
            ...targetGeometry,
            type,
            stellarType: "G",
            orbitSemiMajorAxis: 10000,
            padIdentifier: "1",
        };
        checkProximityFade(target, minDistance);
    });

    function checkProximityFade(target: Target, minDistance: number): void {
        for (const [factor, opacity] of [
            [0.25, 0],
            [0.5, 0],
            [0.75, 0.5],
            [1, 1],
            [2, 1],
        ] as const) {
            expect(getTargetCursorOpacity(target, minDistance * factor, null, true, false)).toBeCloseTo(opacity);
            expect(getTargetCursorOpacity(target, minDistance * factor, null, false, true)).toBeCloseTo(
                target.type === TargetType.STAR_SYSTEM ? 0 : opacity,
            );
        }
    }

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
