# Cosmos Journeyer

[![pages-build-deployment](https://github.com/BarthPaleologue/planetEngine/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/BarthPaleologue/planetEngine/actions/workflows/pages/pages-build-deployment)
[![tauri build and release](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tauri-release.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tauri-release.yml)
[![ESLint Check](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/eslint.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/eslint.yml)
[![Jest Coverage](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tests.yml/badge.svg)](https://github.com/BarthPaleologue/CosmosJourneyer/actions/workflows/tests.yml)
[![License](https://img.shields.io/github/license/BarthPaleologue/planetEngine)](./LICENSE.md)

[![Teaser Video](./coverImages/video.png)](https://youtu.be/5pXZqHRShTE)

Cosmos Journeyer is the procedural universe running inside a web page that makes space exploration accessible for everyone.

The main website of the project is online at https://cosmosjourneyer.com/

The main deployment of the procedural universe can be accessed https://barthpaleologue.github.io/CosmosJourneyer/

## Documentation

The documentation is online at https://barthpaleologue.github.io/CosmosJourneyer/docs/

Additionally, the [ARCHITECTURE.md](./ARCHITECTURE.md) file contains a big picture explanation of the architecture of the project.

To build it locally, run `npm run docs` and then `npm run serve:docs` to serve it at `localhost:8081`.

## Contributing

Contributions are welcome! There is too much to do for one person alone. 

If you want to contribute, you will find guidelines and ideas [here](./CONTRIBUTING.md).

## Sponsor

Developing Cosmos Journeyer is time-consuming and generates no revenue since it is free and open-source.

If you like the project, please consider sponsoring it on [Patreon](https://www.patreon.com/barthpaleologue) or [GitHub Sponsors](

The project has a ko-fi page at https://ko-fi.com/cosmosjourneyer if you feel like sponsoring the project!

## Features

Every telluric planet and moon has a surface that can be explored by the player using a spaceship, or by foot!

![From Space](./coverImages/space.png)

Cosmos Journeyer allows to travel from one celestial body to another without any loading screen, giving the player a seamless experience while exploring.

![A little bit closer](./coverImages/moon.png)

Planet surfaces are filled with procedural vegetation and rocks and butterflies to make them feel more alive.

![On the surface](./coverImages/ground.png)

Cosmos Journeyer generates a virtually infinite amount of star systems that all have a star, often planets, and sometimes moons.

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
- The people from [BabylonJS](https://www.babylonjs.com/) for their amazing work on the BabylonJS framework and their help on the forum