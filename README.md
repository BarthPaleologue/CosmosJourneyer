# Cosmos Journeyer

[![pages-build-deployment](https://github.com/BarthPaleologue/planetEngine/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/BarthPaleologue/planetEngine/actions/workflows/pages/pages-build-deployment)
[![tauri build and release](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tauri-release.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tauri-release.yml)
[![ESLint Check](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/eslint.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/eslint.yml)
[![Jest Coverage](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tests.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tests.yml)
[![License](https://img.shields.io/github/license/BarthPaleologue/planetEngine)](./LICENSE.md)

[![Teaser Video](./coverImages/video.png)](https://youtu.be/5pXZqHRShTE)

## What is Cosmos Journeyer?

Cosmos Journeyer is the open-source procedural universe running inside a web page that makes space exploration
accessible for everyone.
Planets are fully explorable from orbit down to the surface, and the universe is virtually infinite.

## My vision for the project

Disclaimer: my vision for Cosmos Journeyer does not reflect its current state. It is still a work in progress that lacks
a lot of the features I want to implement.

### The narrative

The story is all about your personal journey: a young pilot starting their journey as part of an exploration initiative, following the
steps of your father.
You will stumble early on a disturbing message, seemingly coming from the event horizon of a black hole. That's already weird,
but it gets weirder when you realize that the message is coming from your father who died years ago in mission.
This path will lead you to the strangest places in the universe, making you experience the sublime behind the expense of
the cosmos, and touching the answer to the big questions about the nature of reality.

"Everything that could be, is."

### Gameplay

Cosmos Journeyer is a game about exploration: watching beautiful cosmic landscapes, uncovering weird dimensional anomalies and of course take a lot of screenshots!

The overarching principle is as follows: for every travel you make, it will open new interesting path that you will want to take. 
This will be achieved through the narrative which will give you directions, but rarely a fixed path to follow. 
You will be free to find your own path through the stars and make interesting encounters on the way to the truth about the universe. 

## Sponsor

Help me make Cosmos Journeyer a reality! The development is time-consuming but generates no revenue by itself.

Sponsoring the project on [Patreon](https://www.patreon.com/barthpaleologue)
or [GitHub Sponsors](https://github.com/sponsors/BarthPaleologue) will help secure the future of the project.

The project also has a ko-fi page at https://ko-fi.com/cosmosjourneyer if you feel like buying me a coffee!

## Try it now!

The main website of the project is online at https://cosmosjourneyer.com/

The main deployment of the procedural universe can be accessed https://barthpaleologue.github.io/CosmosJourneyer/

## Why Cosmos Journeyer?

Why make Cosmos Journeyer when games like Elite Dangerous, Star Citizen, No Man's Sky or Kerbal Space Program already exist?

There are many reasons of course but here are the main ones:

- **Open Source**: Other games such as Elite are dependent on their studios to keep them alive. When the game will no
  longer be profitable, they will stop supporting it and then the games will be dead forever (see Kerbal Space Program 2 debacle for a recent example). By going open-source,
  Cosmos Journeyer will be able to evolve and improve continuously, without the need for a studio. Anyone can pick it up
  and make it their own.
- **Exploration Focused**: I always felt that exploration was the most interesting part of space games. At the same time
  I feel the other games are too focused on combat, trading or multiplayer content. I want Cosmos Journeyer to be an
  exploration first game, where your main drive is to discover cool things, take pictures, and dream for a bit.
- **Personal**: I don't know it's just so exciting to create an entire universe from scratch. It really is a dream
  comming true for me.

## Share your screenshots!

There is a subreddit for Cosmos Journeyer at https://www.reddit.com/r/CosmosJourneyer/. Don't hesitate to share
screenshots or just ask questions about the project!

## Contributing

Contributions are welcome! There is too much to do for one person alone.

If you want to contribute, you will find guidelines and ideas [here](./CONTRIBUTING.md).

### Documentation

The documentation is online at https://barthpaleologue.github.io/CosmosJourneyer/docs/

Additionally, the [ARCHITECTURE.md](./ARCHITECTURE.md) file contains a big picture explanation of the architecture of
the project.

To build it locally, run `npm run docs` and then `npm run serve:docs` to serve it at `localhost:8081`.

## Roadmap

You can have a look at the roadmap of the project on the website at https://cosmosjourneyer.com/

The deadlines are not set in stone and can be moved around as I am not working full time on the project.

## Features

Every telluric planet and moon has a surface that can be explored by the player using a spaceship, or by foot!

![From Space](./coverImages/space.png)

Cosmos Journeyer allows to travel from one celestial body to another without any loading screen, giving the player a
seamless experience while exploring.

![A little bit closer](./coverImages/moon.png)

Planet surfaces are filled with procedural vegetation and rocks and butterflies to make them feel more alive.

![On the surface](./coverImages/ground.png)

Cosmos Journeyer generates a virtually infinite amount of star systems that all have a star, often planets, and
sometimes moons.

![Star map](./coverImages/starmap.png)

## Build

First, clone the repository and install the dependencies with `pnpm install`.

### Web

To build the web version of Cosmos Journeyer, run `pnpm run build`. Everything will be built in the `dist` folder.

### Tauri

Cosmos Journeyer can be built as a desktop application using Tauri!

First you will need a bazillion dependencies, here is a list of some of them if you are using a Debian base OS:

```bash
sudo apt install -y libwebkit2gtk-4.0-dev libgtk-3-dev libsoup2.4-dev libjavascriptcoregtk-4.0-dev librsvg2-dev libwebkit2gtk-4.0-dev libappindicator3-dev patchelf
```

Then you can build the application with `pnpm tauri build`.

## Contributors

Thank you to all the people who have contributed to Cosmos Journeyer!

![Contributors](https://contrib.rocks/image?repo=BarthPaleologue/CosmosJourneyer)

## Credits

All credits can be found in [the credits panel](./src/html/mainMenu.html) of the game.

## Special Thanks

- Martin Molli for his fearless refactoring of the messy code base in its early days
- The people from [BabylonJS](https://www.babylonjs.com/) for their amazing work on the BabylonJS framework and their
  help on the forum
- My family for their continuous support