import type { UpdateInfo } from "electron-updater";
import { afterEach, describe, expect, it, vi } from "vitest";

import { requireMinimumReleaseAge } from "./releaseAge.js";

const now = Date.parse("2026-11-07T12:00:00.000Z");
const oneHour = 60 * 60 * 1_000;

const updateInfo: UpdateInfo = {
    version: "1.12.0",
    files: [],
    path: "",
    sha512: "",
    releaseDate: "2026-01-01T00:00:00.000Z",
};

/**
 * Stubs a GitHub Releases API response for update-age tests.
 * @param publishedAt - GitHub's actual publication timestamp.
 * @param draft - Whether GitHub reports the release as a draft.
 * @returns The mocked fetch function.
 */
function stubGitHubRelease(publishedAt: unknown, draft = false) {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ published_at: publishedAt, draft })));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("requireMinimumReleaseAge", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("accepts a release once it is at least 24 hours old", async () => {
        vi.spyOn(Date, "now").mockReturnValue(now);
        const fetchMock = stubGitHubRelease(new Date(now - 24 * oneHour).toISOString());

        expect(await requireMinimumReleaseAge(() => true)(updateInfo)).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.github.com/repos/BarthPaleologue/CosmosJourneyer/releases/tags/v1.12.0",
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
    });

    it("rejects a fresh release, then accepts it on a later check", async () => {
        const clock = vi.spyOn(Date, "now").mockReturnValue(now);
        const fetchMock = stubGitHubRelease(new Date(now - 23 * oneHour).toISOString());
        const isSupported = requireMinimumReleaseAge(() => true);

        expect(await isSupported(updateInfo)).toBe(false);
        clock.mockReturnValue(now + oneHour);
        expect(await isSupported(updateInfo)).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("preserves the built-in compatibility check without contacting GitHub", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);
        const originalCheck = vi.fn().mockResolvedValue(false);

        expect(await requireMinimumReleaseAge(originalCheck)(updateInfo)).toBe(false);
        expect(originalCheck).toHaveBeenCalledWith(updateInfo);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("fails closed when GitHub returns an error", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 404 })));
        vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(await requireMinimumReleaseAge(() => true)(updateInfo)).toBe(false);
    });

    it("fails closed when the GitHub API is unavailable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
        vi.spyOn(console, "warn").mockImplementation(() => {});

        expect(await requireMinimumReleaseAge(() => true)(updateInfo)).toBe(false);
    });

    it("rejects missing or invalid publication metadata", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        vi.spyOn(Date, "now").mockReturnValue(now);
        const isSupported = requireMinimumReleaseAge(() => true);

        stubGitHubRelease(null);
        expect(await isSupported(updateInfo)).toBe(false);

        stubGitHubRelease("not a date");
        expect(await isSupported(updateInfo)).toBe(false);

        stubGitHubRelease(new Date(now - 30 * oneHour).toISOString(), true);
        expect(await isSupported(updateInfo)).toBe(false);

        stubGitHubRelease(new Date(now + oneHour).toISOString());
        expect(await isSupported(updateInfo)).toBe(false);
    });
});
