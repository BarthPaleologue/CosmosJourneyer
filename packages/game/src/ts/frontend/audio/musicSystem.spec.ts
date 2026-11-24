import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

import type { Musics } from "@/frontend/assets/audio/musics";
import { StarSystemView } from "@/frontend/starSystemView";

import { MusicSystem } from "./musicSystem";

/**
 * Builds a fresh per-test object inheriting the class prototype, narrowed by a runtime
 * instanceof check so no type assertion is needed and the shared class prototype stays untouched.
 * @param fields State and method overrides placed on the fresh object.
 * @returns A per-test instance of the class, narrowed by a runtime instanceof check.
 */
function createStarSystemView(fields: Record<string, unknown>): StarSystemView {
    const candidate: unknown = Object.setPrototypeOf(fields, StarSystemView.prototype);
    if (!(candidate instanceof StarSystemView)) {
        throw new Error("unreachable: candidate inherits StarSystemView.prototype");
    }

    return candidate;
}

/**
 * @param fields State and method overrides placed on the fresh object.
 * @returns A per-test instance of the class, narrowed by a runtime instanceof check.
 * @see createStarSystemView
 */
function createMusicSystem(fields: Record<string, unknown>): MusicSystem {
    const candidate: unknown = Object.setPrototypeOf(fields, MusicSystem.prototype);
    if (!(candidate instanceof MusicSystem)) {
        throw new Error("unreachable: candidate inherits MusicSystem.prototype");
    }

    return candidate;
}

/** @returns Music selection inputs and spies without an audio device. */
function createFixture() {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    onTestFinished(() => {
        scene.dispose();
        engine.dispose();
    });
    const transform = new TransformNode("transform", scene);
    const musics = {
        wandering: { name: "wandering" },
        straussBlueDanube: { name: "straussBlueDanube" },
        deepRelaxation: { name: "deepRelaxation" },
        atlanteanTwilight: { name: "atlanteanTwilight" },
        infinitePerspective: { name: "infinitePerspective" },
        thatZenMoment: { name: "thatZenMoment" },
        echoesOfTime: { name: "echoesOfTime" },
        peaceOfMind: { name: "peaceOfMind" },
        spacialWinds: { name: "spacialWinds" },
        mesmerize: { name: "mesmerize" },
        reawakening: { name: "reawakening" },
        equatorialComplex: { name: "equatorialComplex" },
        soaring: { name: "soaring" },
    } satisfies Record<keyof Musics, { name: string }>;
    const isLanded = vi.fn(() => false);
    const isWarpEnabled = vi.fn(() => false);
    const getTargetLandingPad = vi.fn<() => object | null>(() => null);
    const nearestObject = {
        model: { type: "star" },
        getTransform: () => transform,
        getBoundingRadius: () => 1,
    };
    const shipControls = { getTransform: () => transform };
    const characterControls = { getTransform: () => transform };
    const view = {
        isLoadingSystem: () => false,
        getSpaceshipControls: () => ({
            getSpaceship: () => ({
                isLanded,
                getTargetLandingPad,
                getInternals: () => ({
                    getWarpDrive: () => ({ isEnabled: isWarpEnabled, isDisabled: () => !isWarpEnabled() }),
                }),
            }),
        }),
        getActiveControls: vi.fn(() => shipControls),
        getCharacterControls: () => characterControls,
        getStarSystem: () => ({
            getNearestOrbitalObject: () => nearestObject,
            getSystemEntities: () => [{ placement: { getTransform: () => transform } }],
        }),
    };
    const starSystemView = createStarSystemView(view);
    const entityMusic = vi.fn<() => Array<keyof Musics>>(() => []);
    const music = createMusicSystem({
        currentMusic: null,
        silenceSeconds: 0,
        musics,
        starSystemView,
        systemEntityProcessor: entityMusic,
    });
    const selection = vi.spyOn(music, "setMusicFromSelection").mockImplementation(() => {});
    const singleTrack = vi.spyOn(music, "setMusic").mockImplementation(() => {});
    return {
        music,
        musics,
        view,
        characterControls,
        isLanded,
        isWarpEnabled,
        getTargetLandingPad,
        nearestObject,
        entityMusic,
        selection,
        singleTrack,
    };
}

describe("music selection priority", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each(["star", "blackHole", "spaceStation"])("prefers warp music near a %s", (type) => {
        const fixture = createFixture();
        fixture.isWarpEnabled.mockReturnValue(true);
        fixture.nearestObject.model.type = type;
        fixture.entityMusic.mockReturnValue(type === "star" ? ["equatorialComplex"] : []);

        fixture.music.update(false, true, false, 1);

        expect(fixture.selection).toHaveBeenCalledExactlyOnceWith([
            fixture.musics.atlanteanTwilight,
            fixture.musics.infinitePerspective,
            fixture.musics.mesmerize,
        ]);
        expect(fixture.singleTrack).not.toHaveBeenCalled();
    });

    it.each(["on foot", "landed"])("selects grounded music when %s", (mode) => {
        const fixture = createFixture();
        if (mode === "on foot") {
            fixture.view.getActiveControls.mockReturnValue(fixture.characterControls);
        } else {
            fixture.isLanded.mockReturnValue(true);
        }

        fixture.music.update(false, true, false, 1);

        expect(fixture.selection).toHaveBeenCalledExactlyOnceWith([
            fixture.musics.thatZenMoment,
            fixture.musics.deepRelaxation,
            fixture.musics.peaceOfMind,
            fixture.musics.mesmerize,
            fixture.musics.reawakening,
        ]);
    });

    it("keeps the ordinary flight selection while flying without warp", () => {
        const fixture = createFixture();

        fixture.music.update(false, true, false, 1);

        expect(fixture.selection).toHaveBeenCalledExactlyOnceWith([
            fixture.musics.thatZenMoment,
            fixture.musics.deepRelaxation,
            fixture.musics.peaceOfMind,
        ]);
    });

    it("keeps docking music ahead of the warp selection", () => {
        const fixture = createFixture();
        fixture.isWarpEnabled.mockReturnValue(true);
        fixture.getTargetLandingPad.mockReturnValue({});

        fixture.music.update(false, true, false, 1);

        expect(fixture.singleTrack).toHaveBeenCalledExactlyOnceWith(fixture.musics.straussBlueDanube);
        expect(fixture.selection).not.toHaveBeenCalled();
    });
});
