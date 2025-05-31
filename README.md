# Cosmos Journeyer

![Latest Release](https://img.shields.io/github/v/release/BarthPaleologue/CosmosJourneyer)
[![CI Pipeline](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/ci.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/ci.yml)
[![pages-build-deployment](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/pages/pages-build-deployment)
[![License](https://img.shields.io/github/license/BarthPaleologue/CosmosJourneyer)](./LICENSE.md)

[![Teaser Video](./coverImages/video.png)](https://youtu.be/5pXZqHRShTE)

- [What is Cosmos Journeyer?](#what-is-cosmos-journeyer)
- [How to play](#how-to-play)
    - [Online](#online)
    - [Locally](#locally)
- [Community and support](#community-and-support)
- [My vision for the project](#my-vision-for-the-project)
- [Why Cosmos Journeyer?](#why-cosmos-journeyer)
- [Contributing](#contributing)
- [Sponsor](#sponsor)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Features](#features)
- [Build](#build)
    - [Web](#web)
    - [Tauri](#tauri)
- [Contributors](#contributors)
- [License](#license)
- [Credits](#credits)
- [Special Thanks](#special-thanks)

## What is Cosmos Journeyer?

Cosmos Journeyer is a space exploration game running directly in the browser! Take your spaceship and witness the beauty of this virtually infinite universe.

From stellar black holes and fully explorable planets down to single grass blades, to asteroid fields, your journey will be unforgettable.

## How to play

### Online

You can play freely from the main website of the project at [cosmosjourneyer.com](https://cosmosjourneyer.com/)

### Locally

You can also play locally! You can get an installer for your system by going to [the latest release](https://github.com/BarthPaleologue/CosmosJourneyer/releases).

If you want the cutting edge version, follow these steps:

1. Install prerequisites:

- [Git](https://git-scm.com/) (install with your package manager or from https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [Pnpm](https://pnpm.io/) (install with `npm install -g pnpm`)

2. Clone the repo with `git clone https://github.com/BarthPaleologue/CosmosJourneyer.git`
3. Install the dependencies with `pnpm install`
4. Build the project with `pnpm build`
5. Serve the project with `pnpm serve:prod`
6. Play at http://localhost:8080

To update your local version, either download the latest installer or run `git pull` in your local install.

## Community and support

If you encounter any bugs or want to request features, please open an [issue](https://github.com/BarthPaleologue/CosmosJourneyer/issues) or send an email to <barth.paleologue@cosmosjourneyer.com>.

For general discussion and sharing screenshots, visit the [official subreddit](https://www.reddit.com/r/CosmosJourneyer/).

## My vision for the project

For my detailed vision for the project, please refer to the [VISION.md](./VISION.md) file.

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
  coming true for me.

## Contributing

Contributions are welcome! There is too much to do for one person alone.

If you want to contribute, you will find guidelines and ideas [here](./CONTRIBUTING.md).

## Sponsor

Help me make Cosmos Journeyer a reality! The development is time-consuming but generates no revenue by itself.

Sponsoring the project on [Patreon](https://www.patreon.com/barthpaleologue)
or [GitHub Sponsors](https://github.com/sponsors/BarthPaleologue) will help secure the future of the project.

The project also has a ko-fi page at https://ko-fi.com/cosmosjourneyer if you feel like buying me a coffee!

### Documentation

The documentation is online at https://barthpaleologue.github.io/CosmosJourneyer/doc/

Additionally, the [ARCHITECTURE.md](./ARCHITECTURE.md) file contains a big picture explanation of the architecture of
the project.

To build it locally, run `npm run doc` and then `npm run serve:doc` to serve it at `localhost:8081`.

## Roadmap

You can have a look at the roadmap of the project on the website at https://cosmosjourneyer.com/

The deadlines are not set in stone and can be moved around as I am not working full time on the project.

## Features

Every telluric planet and moon has a surface that can be explored by the player using a spaceship, or by foot.

![From Space](./coverImages/space.png)

Cosmos Journeyer lets you travel from one celestial body to another without any loading screen, giving the player a
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

To build the web version of Cosmos Journeyer, run `pnpm build`. Everything will be built in the `dist` folder.

To start the production server version, run `pnpm serve:prod`. The development version can be started with `pnpm serve`.

### Tauri

Cosmos Journeyer can be built as a desktop application using Tauri.

To find what dependencies your OS is missing, run `pnpm tauri info`.

Then you can build the application with `pnpm tauri build` or run the dev version with `pnpm tauri dev`.

The build artifacts will appear in `src-tauri/target/release/bundle/<platform>`.

## Contributors

Thank you to all the people who have contributed to Cosmos Journeyer!

![Contributors](https://contrib.rocks/image?repo=BarthPaleologue/CosmosJourneyer)

## License

Cosmos Journeyer is a free and open-source software licensed under the terms of the GNU AGPL License. Look at the [LICENSE.md](./LICENSE.md) file for the full license text.

## Credits

All credits can be found in [the credits panel](./src/html/mainMenu.html) of the game.

## Special Thanks

- Martin Molli for his fearless refactoring of the messy code base in its early days
- The people from [BabylonJS](https://www.babylonjs.com/) for their amazing work on the BabylonJS framework and their
  help on the forum
- My family for their continuous support
