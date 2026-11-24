# `no-implicit-random`

Disallows **implicit randomness**: any use of `Math.random`, whether called (`Math.random()`) or referenced as a value (`randRange(0, 1, Math.random, 0)`).

Cosmos Journeyer's world generation must be reproducible: the same inputs — above all the universe seed — must produce the same data on every run, across sessions, tests and save loads. `Math.random()` draws from hidden global state, so it produces different content between two runs of the same seed, makes tests non-deterministic, and makes bugs irreproducible.

## Rule details

The rule reports every member access that resolves to `Math.random`:

```ts
const radius = Math.random() * 100; // reported
const angle = Math.random() * 2 * Math.PI; // reported
const offset = randRange(-50, 50, Math.random, 0); // reported: Math.random referenced as a value
const id = Math["random"](); // reported
```

## Allowed patterns

Draw from an explicit, seedable source from `@cosmos-journeyer/random`:

```ts
import { getRngFromSeed, squirrelNoise } from "@cosmos-journeyer/random";

// Indexed deterministic noise: same (seed, index) always yields the same value.
const radius = squirrelNoise(systemSeed, i) * 100;

// A reusable indexed rng for procedural generators.
const rng = getRngFromSeed(systemSeed);
const asteroids = generateAsteroids(100, rng);
```

Passing any explicit `(step: number) => number` function to the distribution helpers is fine — that is the point: the source is visible at the call site.

## Exemptions

Playgrounds (`packages/game/src/ts/playgrounds/**`) are exempt via config: they are non-persistent demo scenes whose output never enters a saved or shared universe. The exemption is by role (the playground directory), not by file name, and does not extend to production code.
