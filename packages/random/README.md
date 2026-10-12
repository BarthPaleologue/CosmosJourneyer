# Cosmos Journeyer Random

The TypeScript entry point for indexed random generation, distributions, sampling, and simplex noise.
Independent of the game, universe models, and Babylon.js.

```ts
import { getRngFromSeed, normalRandom, randRangeInt, wheelOfFortune } from "@cosmos-journeyer/random";

const rng = getRngFromSeed(42);
const sample = rng(7); // The same seed and index always give the same value, regardless of call order.
const count = randRangeInt(2, 5, rng, 10); // Includes both 2 and 5.
const mass = normalRandom(100, 10, rng, 20); // Uses indices 20 and 21.
const kind = wheelOfFortune(
    [
        ["rock", 3],
        ["ice", 1],
    ],
    rng(30),
);
```

Distribution helpers also accept a non-indexed source, or default to `Math.random`:

```ts
import { randRange, uniformRandBool } from "@cosmos-journeyer/random";

const radius = randRange(10, 20);
const enabled = uniformRandBool(0.5);
const deterministicRadius = randRange(10, 20, () => 0.25);
```

`IndexedRng` is `(index: number) => number`. Distribution helpers default to index zero when no index
is supplied. `normalRandom` uses that index and the following one.
`getRngFromSeed` and `seededLegacySquirrelNoise` both bind the seed of `legacySquirrelNoise(seed, index)`.

The package exports:

- Generation: `getRngFromSeed`, `seededLegacySquirrelNoise`, `legacySquirrelNoise`, and the `IndexedRng` type.
- Distributions: `centeredRand`, `randRange`, `randRangeInt`, `normalRandom`, `uniformRandBool`,
  and `uniformToExponential`.
- Sampling: `wheelOfFortune` and `randomPieChart`.
- Noise: `makeNoise3D`, re-exported from `fast-simplex-noise@4.0.0`.

Simplex noise takes a non-indexed source. Keep the consumer's existing sequence of indices when seeding
its permutation table:

```ts
import { getRngFromSeed, makeNoise3D } from "@cosmos-journeyer/random";

const rng = getRngFromSeed(42);
let index = 0;
const noise = makeNoise3D(() => rng(index++));
const height = noise(0.1, 0.2, 0.3);
```
