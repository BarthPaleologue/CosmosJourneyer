const repositoryUrl = "https://github.com/BarthPaleologue/CosmosJourneyer";
const contactEmail = "barth.paleologue@cosmosjourneyer.com";

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
} as const;
