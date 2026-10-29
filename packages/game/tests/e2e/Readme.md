# End-to-End testing in Cosmos Journeyer

Cosmos Journeyer uses [Playwright](https://playwright.dev/) for end-to-end testing. The tests are located in the `packages/game/tests/e2e` directory.

## Writing tests

You can write end-to-end tests in `packages/game/tests/e2e` using Playwright's API. You can have a look at `default.spec.ts` for an example of how to write a test.

Screenshots are stored in folders next to the test files. The screenshots are versioned using git-lfs, so you need to have git-lfs installed and configured to use them.

The rover playground starts with the camera behind the rover. It accepts `cameraAlpha` and `cameraBeta` (radians) and `cameraRadius` (meters) to reproduce other views. For example: `/playground.html?scene=rover&freeze=5&cameraAlpha=2.356194490192345&cameraBeta=1.4&cameraRadius=12`. Its obstacle layout is deterministic, and the rover starts just above the ground so frozen captures also show the wheels near the surface.

## Git LFS

You need to have [git-lfs](https://git-lfs.github.com/) installed and configured to use the screenshots. You can install it using the following command:

```bash
git lfs install
```

Then, you can pull the screenshots using the following command:

```bash
git lfs pull
```

## Run locally

To run the tests locally, you need to have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed. You can install pnpm globally using npm:

```bash
npm install -g pnpm
```

Then, you can install the dependencies:

```bash
pnpm install
```

then install the playwright browsers:

```bash
pnpm --filter @cosmos-journeyer/game exec playwright install
```

Finally, you can run the tests. The production bundle is built automatically before Playwright starts:

```bash
pnpm test:e2e
```

To update the screenshots, run the update command. This also rebuilds the production bundle first:

```bash
pnpm test:e2e:update
```

## Terrain heightmaps

`/playground.html?scene=terrainHeightmap&seed=261` samples the game's Slang terrain compute shader on a 512×256 equirectangular grid. North is at the top, longitudes run from −180° to +180°, and grayscale maps a fixed −10 km to +10 km elevation relative to sea level. Change `seed` to inspect another generated planet. Raw elevations in metres above the planet's reference radius are available in `window.terrainHeightmap`.

`terrainHeightmap.spec.ts` compares maps for two seeds and checks finite heights, relief, the longitude seam, and both poles. Update only these baselines with `pnpm --filter @cosmos-journeyer/game exec playwright test terrainHeightmap.spec.ts --update-snapshots` after rebuilding the game.
