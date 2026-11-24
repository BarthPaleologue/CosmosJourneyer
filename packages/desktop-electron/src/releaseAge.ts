import type { UpdateInfo } from "electron-updater";
import { z } from "zod";

const minimumReleaseAgeMs = 24 * 60 * 60 * 1_000;
const githubApiTimeoutMs = 10_000;
const githubReleaseApiUrl = "https://api.github.com/repos/BarthPaleologue/CosmosJourneyer/releases/tags/";

const githubReleaseSchema = z.looseObject({
    published_at: z.string(),
    draft: z.literal(false),
});

type VerifyUpdateSupport = (info: UpdateInfo) => boolean | Promise<boolean>;

/**
 * Excludes GitHub releases published less than 24 hours ago, without bypassing
 * electron-updater's built-in OS compatibility check.
 * @param originalCheck - The updater's existing compatibility check.
 * @returns An asynchronous check that fails closed if GitHub cannot be verified.
 */
export function requireMinimumReleaseAge(originalCheck: VerifyUpdateSupport): VerifyUpdateSupport {
    return async (info) => {
        if (!(await originalCheck(info))) {
            return false;
        }

        try {
            const response = await fetch(`${githubReleaseApiUrl}v${encodeURIComponent(info.version)}`, {
                headers: {
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                signal: AbortSignal.timeout(githubApiTimeoutMs),
            });
            if (!response.ok) {
                console.warn(
                    `Could not verify desktop release ${info.version}: GitHub returned HTTP ${response.status}.`,
                );
                return false;
            }

            const parsedRelease = githubReleaseSchema.safeParse(await response.json());
            if (!parsedRelease.success) {
                console.warn(`Could not verify the publication date of desktop release ${info.version}.`);
                return false;
            }

            const publishedAt = Date.parse(parsedRelease.data.published_at);
            return Number.isFinite(publishedAt) && Date.now() - publishedAt >= minimumReleaseAgeMs;
        } catch (error) {
            console.warn(`Could not verify desktop release ${info.version} with GitHub.`, error);
            return false;
        }
    };
}
