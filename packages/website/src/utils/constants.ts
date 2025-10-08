import type { RoadmapItem, SocialLink } from "@/types";

// Images - using public folder paths
const spaceStationImage = "/static/spacestation.webp";
const spaceShipImage = "/static/spaceship.webp";
const terrainImage = "/static/terrain.webp";
const explorationImage = "/static/exploration.webp";
const tradingImage = "/static/trading.webp";
const llmsImage = "/static/llms.webp";

// Social icons - using public folder paths
const github = "/static/icons/github.png";
const youtube = "/static/icons/youtube.png";
const reddit = "/static/icons/reddit.webp";
const patreon = "/static/icons/patreon.webp";
const devlog = "/static/icons/devlog.webp";

export const SocialLinks = [
    {
        id: "patreon",
        name: "Patreon",
        url: "https://www.patreon.com/barthpaleologue",
        icon: { src: patreon, alt: "patreon" },
        title: "Support the project on Patreon!",
    },
    {
        id: "devlog",
        name: "DevLog",
        url: "https://barthpaleologue.github.io/Blog/tags/cosmos-journeyer/",
        icon: { src: devlog, alt: "devlog" },
        title: "Read the devlogs!",
    },
    {
        id: "youtube",
        name: "YouTube",
        url: "https://youtu.be/AZM6psivIBE",
        icon: { src: youtube, alt: "youtube" },
        title: "Watch the gameplay demo on Youtube!",
    },
    {
        id: "reddit",
        name: "Reddit",
        url: "https://reddit.com/r/CosmosJourneyer",
        icon: { src: reddit, alt: "reddit" },
        title: "Join the community on Reddit!",
    },
    {
        id: "github",
        name: "GitHub",
        url: "https://github.com/BarthPaleologue/CosmosJourneyer",
        icon: { src: github, alt: "github" },
        title: "Contribute on Github!",
    },
] as const satisfies SocialLink[];

export const RoadmapItems = [
    {
        id: "space-stations",
        title: "Space stations",
        eta: "Shipped in Cosmos Journeyer 1.9 - April 2025",
        description: "The first gameplay iteration of Cosmos Journeyer will heavily rely on space stations",
        content: {
            image: {
                src: spaceStationImage,
                alt: "space station",
                width: 480,
                height: 270,
            },
            paragraphs: [
                "The first gameplay iteration of Cosmos Journeyer will heavily rely on space stations: they are the places where humanity has settled among the stars. Space stations are the basis for an economic system that will unlock trading among and between systems.",
                "The stations are designed procedurally, following the laws of physics. The spinning habitats rotate as fast as need to generate an acceleration of 1g for the inhabitants. Moreover the habitat surface is calculated with considerations regarding the population density and the local agricultural system. The solar panel area is also determined by the real energy consumption of the station.",
                'You can learn more about the design of stations in the devlogs <a href="https://barthpaleologue.github.io/Blog//tags/space-station/">here</a>',
            ],
        },
    },
    {
        id: "exploration-content",
        title: "Exploration content",
        eta: "Shipped in Cosmos Journeyer 1.9 - April 2025",
        description: "Stemming from space stations, exploration content will debut in Cosmos Journeyer 1.9",
        content: {
            image: {
                src: explorationImage,
                alt: "exploration",
                width: 480,
                height: 270,
            },
            paragraphs: [
                "Stemming from space stations, exploration content will debut in Cosmos Journeyer 1.9. As the universe is immense, it can be difficult to find the most interesting places.",
            ],
            subsections: [
                {
                    title: "New places to explore",
                    content:
                        'Many solar systems will be populated with strange objects called "anomalies". These objects challenge the law of physics and will give players a spectacle they will not forget any time soon. In addition to that, a small subset of stars will become "strange stars", bathing their worlds in their weird light, never seen before. Asteroid fields are also coming, offering an interesting challenge for pilots as well as new views for photographs!',
                },
                {
                    title: "Missions",
                    content:
                        "To facilitate the journey of the players, tourists from space stations will create missions to bring them to these new interesting places. You will have to travel many light years to reach your destination, encountering more content on the way.",
                },
            ],
        },
    },
    {
        id: "better-planet-surfaces",
        title: "Better planet surfaces",
        eta: "Cosmos Journeyer 2.0 - 2025",
        description: "Taking advantage of WebGPU compute shaders, the terrain of planets will become more complex",
        content: {
            image: {
                src: terrainImage,
                alt: "terrain",
                width: 480,
                height: 270,
            },
            paragraphs: [
                "Taking advantage of WebGPU compute shaders, the terrain of planets will become more complex and varied depending on the planet type. Not only that, but the objects scattered on the terrain will be placed more naturally (no grass on ice) with new variations as well. I would love to also introduce a vehicle for ground exploration.",
            ],
        },
    },
    {
        id: "ship-interiors",
        title: "Ship interiors",
        eta: "Cosmos Journeyer 2.0 - 2026",
        description: "Stepping for the first time on an alien world should be an impactful moment",
        content: {
            image: {
                src: spaceShipImage,
                alt: "spaceship",
                width: 480,
                height: 270,
            },
            paragraphs: [
                'Stepping for the first time on an alien world should be an impactful moment. Some would say an "Armstrong moment" in reference to the 1969 Moon landing.',
                "In order to recreate this incredible experience, I want players to be able to transition from commanding the spaceship to walking in a very smooth way, instead of using teleportation. Players will have to go through their ship airlock, and equalize the pressure before being able to step outside. When opening the airlock to the outside, the volume of sound would change depending on the current air pressure (no sound in space!).",
                "Ship interiors will also come first first person piloting of spaceships, giving a more immersive and enjoyable way of exploring the galaxy.",
            ],
        },
    },
    {
        id: "trading-missions",
        title: "Trading missions",
        eta: "Beyond 2.0 - 2026",
        description:
            "As space stations are designed from the ground up with agricultural production data, trading will emerge naturally",
        content: {
            image: {
                src: tradingImage,
                alt: "trading",
                width: 480,
                height: 270,
            },
            paragraphs: [
                "As space stations are designed from the ground up with agricultural production data, trading will emerge naturally. The price of goods at each station will depend on the local supply, which will be different at each station. This naturally creates trade roads between stations for players to earn money.",
                "In addition to this free form of trading, missions will be available at stations to guide players in their journey.",
            ],
        },
    },
    {
        id: "quest-generation",
        title: "Quest Generation",
        eta: "Beyond 2.0 - 2026",
        description:
            "One of the hardest part of generating a procedural infinite universe, is to create engaging stories",
        content: {
            image: {
                src: llmsImage,
                alt: "llms",
                width: 480,
                height: 270,
            },
            paragraphs: [
                "One of the hardest part of generating a procedural infinite universe, is to create engaging stories that makes sense in the context of the player. The best example of procedurally generated story telling is Dwarf Fortress, which is quite a marvel of engineering when it comes to creating a coherent world that makes sense and feels fresh. Nowadays, LLMs are getting lighter and easier to run locally. I would like to experiment with procedural quest generation per star system that would use system data to create engaging stories that would lead players from planet to planet.",
            ],
        },
    },
] as const satisfies RoadmapItem[];

export const FaqItems = [
    {
        id: "what-is-cosmos-journeyer",
        question: "What is Cosmos Journeyer?",
        answer: "Cosmos Journeyer is a free, open-source space exploration game. The ultimate goal of the game is to make you travel to the most beautiful places of the universe, and make you reflect on our place in it. It is my labor of love, and it will always be free for everyone to use and modify to their liking.",
    },
    {
        id: "how-to-contribute",
        question: "How to contribute?",
        answer: [
            'If you are a player, spread the word! Come and share your screenshots and discuss the game on <a target="_blank" rel="noreferrer" href="https://www.reddit.com/r/CosmosJourneyer/">the official subreddit</a>',
            'If you know how to code, come to <a target="_blank" rel="noreferrer" href="https://github.com/BarthPaleologue/CosmosJourneyer">the github repository</a> is where all the development takes place.',
            'You also can help the project grow by sponsoring my work on <a target="_blank" rel="noreferrer" href="https://www.patreon.com/barthpaleologue">Patreon</a> and <a target="_blank" rel="noreferrer" href="https://github.com/sponsors/BarthPaleologue">GitHub</a>.',
        ],
    },
    {
        id: "get-in-touch",
        question: "Get in touch",
        answer: 'If you have any questions, or just want to say hi, come to <a target="_blank" rel="noreferrer" href="https://www.reddit.com/r/CosmosJourneyer/">the official subreddit</a> or reach me by <a href="mailto:barth.paleologue@cosmosjourneyer.com">email</a>',
    },
] as const;

export const SiteConfig = {
    name: "Cosmos Journeyer",
    description:
        "Cosmos Journeyer is a free and open-source space exploration game that lets you discover the wonders of the universe.",
    url: "https://cosmosjourneyer.com",
    gameUrl: "https://barthpaleologue.github.io/CosmosJourneyer/",
    email: "barth.paleologue@cosmosjourneyer.com",
} as const;
