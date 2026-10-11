import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it, vi } from "vitest";

import type { Musics } from "@/frontend/assets/audio/musics";
import type { StarSystemView } from "@/frontend/starSystemView";

import { MusicSystem } from "./musicSystem";

/** @returns Music selection inputs and spies without an audio device. */
function createFixture() {
    const trackNames = [
        "wandering",
        "straussBlueDanube",
        "deepRelaxation",
        "atlanteanTwilight",
        "infinitePerspective",
        "thatZenMoment",
        "echoesOfTime",
        "peaceOfMind",
        "spacialWinds",
        "mesmerize",
        "reawakening",
        "equatorialComplex",
        "soaring",
    ] satisfies Array<keyof Musics>;
    const musics = Object.fromEntries(trackNames.map((name) => [name, { name }])) as Musics;
    const transform = { getAbsolutePosition: () => Vector3.Zero() };
    const shipControls = { getTransform: () => transform };
    const characterControls = { getTransform: () => transform };
    const isLanded = vi.fn(() => false);
    const isWarpEnabled = vi.fn(() => false);
    const getTargetLandingPad = vi.fn<() => object | null>(() => null);
    const nearestObject = {
        model: { type: "star" },
        getTransform: () => transform,
        getBoundingRadius: () => 1,
    };
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
    const entityMusic = vi.fn<() => Array<keyof Musics>>(() => []);
    const music = new MusicSystem(
        musics,
        { unlockAsync: vi.fn<() => Promise<void>>().mockResolvedValue(undefined) } as unknown as AudioEngineV2,
        view as unknown as StarSystemView,
        entityMusic,
    );
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
