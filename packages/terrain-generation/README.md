# terrain-generation

`terrain-generation` packages the Rust-powered height-field engine that Cosmos Journeyer uses to build planetary
meshes. The WebAssembly artifacts ship precompiled, so players and contributors can consume the package from npm
without having Rust tooling installed locally.

## Installation

```sh
pnpm add terrain-generation
# or npm install terrain-generation
# or yarn add terrain-generation
```

The published package exposes typed WebAssembly bindings and does not require runtime configuration. When this
repository is used as a workspace dependency, keep in mind that the game project intentionally depends on the npm
distribution via the `npm:` protocol so that only maintainers need the Rust toolchain.

## Runtime usage

```ts
import { build_chunk_vertex_data, BuildData, TerrainSettings } from "terrain-generation";

const terrainSettings = new TerrainSettings();
terrainSettings.continent_base_height = 0.45;
terrainSettings.continents_frequency = 1.25;

const buildData = new BuildData(
    /* planetDiameter */ 12000,
    /* depth */ 5,
    /* faceIndex */ 3,
    /* originX */ 0,
    /* originY */ 0,
    /* originZ */ 0,
    /* seed */ 12_345,
    /* verticesPerSide */ 65,
    terrainSettings,
);

const positions = new Float32Array(65 * 65 * 3);
const indices = new Uint16Array((65 - 1) * (65 - 1) * 2 * 3);
const normals = new Float32Array(positions.length);

const result = build_chunk_vertex_data(
    buildData,
    positions,
    indices,
    normals,
    /* instances */ new Float32Array(0),
    /* alignedInstances */ new Float32Array(0),
    /* scatterPerSquareMeter */ 0,
);

console.log(result.average_height);
buildData.free();
```

## Developing the WASM module locally

Most contributors only need Node.js ≥ 20 and pnpm ≥ 10 to consume the published package. To rebuild the WebAssembly
artifacts or run the Rust toolchain you will additionally need:

- [Rust](https://www.rust-lang.org/tools/install) with `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)
- [`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/)

### Common tasks

```sh
# Build the release WASM bundle (writes to pkg/)
pnpm --filter terrain-generation build

# Iterative development build
pnpm --filter terrain-generation build:dev

# Rust formatting, linting, and tests
pnpm --filter terrain-generation format
pnpm --filter terrain-generation lint
pnpm --filter terrain-generation test
```

The scripts check whether the required Rust tooling is available and skip the step with a friendly message if it is
missing. This keeps the broader workspace usable for developers who are only touching TypeScript projects.

## Publishing workflow

1. Ensure `pkg/` contains freshly built artifacts (`pnpm --filter terrain-generation build`).
2. Update the `version` in `package.json` following semantic versioning.
3. Run `pnpm publish --filter terrain-generation` from the repository root.

After publishing, the game package can continue consuming the npm release without any additional configuration.
