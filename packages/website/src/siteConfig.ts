const repositoryUrl = "https://github.com/BarthPaleologue/CosmosJourneyer";
const contactEmail = "barth.paleologue@cosmosjourneyer.com";
const desktopReleaseVersion = "1.11.0";
const desktopReleaseUrl = `${repositoryUrl}/releases/download/v${desktopReleaseVersion}`;

export const siteConfig = {
    name: "Cosmos Journeyer",
    description:
        "Cosmos Journeyer is a free, open-source space exploration game with procedural star systems and explorable planets.",
    url: "https://cosmosjourneyer.com",
    gameUrl: "https://cosmosjourneyer.com/play/",
    repositoryUrl,
    licenseUrl: `${repositoryUrl}/blob/main/LICENSE.md`,
    emailUrl: `mailto:${contactEmail}`,
    community: {
        reddit: "https://reddit.com/r/CosmosJourneyer",
        bluesky: "https://bsky.app/profile/barthpaleologue.bsky.social",
        trailer: "https://youtu.be/AZM6psivIBE",
        patreon: "https://www.patreon.com/barthpaleologue",
        githubSponsors: "https://github.com/sponsors/BarthPaleologue",
    },
    desktopRelease: {
        version: desktopReleaseVersion,
        downloads: [
            {
                platform: "Windows",
                detail: "x64 · .exe",
                url: `${desktopReleaseUrl}/Cosmos.Journeyer-${desktopReleaseVersion}-win-x64.exe`,
            },
            {
                platform: "macOS",
                detail: "Apple Silicon · .dmg",
                url: `${desktopReleaseUrl}/Cosmos.Journeyer-${desktopReleaseVersion}-mac-arm64.dmg`,
            },
            {
                platform: "Debian / Ubuntu",
                detail: "amd64 · .deb",
                url: `${desktopReleaseUrl}/Cosmos.Journeyer-${desktopReleaseVersion}-linux-amd64.deb`,
            },
            {
                platform: "Other Linux",
                detail: "x86_64 · AppImage",
                url: `${desktopReleaseUrl}/Cosmos.Journeyer-${desktopReleaseVersion}-linux-x86_64.AppImage`,
            },
        ],
    },
} as const;
