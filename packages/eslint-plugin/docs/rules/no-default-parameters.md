# `no-default-parameters`

Disallows default values in function parameter lists.

A parameter default lets a call site silently omit a constitutive argument and inherit a hidden decision (a seed, a physical bound, a quality level, a fallback RNG...). In procedural generation especially, that makes the same inputs produce different worlds and breaks reproducibility. Every constitutive argument must be visible at the call site.

## Rule details

The rule reports every assignment pattern (`= value`) that belongs to the parameter list of the nearest enclosing function-like node:

```ts
function generatePlanet(seed = 42, radius = 6371000): Planet;

const randRange = (min = 0, max = 1) => min + Math.random() * (max - min);

function generateTerrain({ resolution = 64 }: Options): Terrain;

function generateBiome([index = 0]: Array<number>): Biome;

class Generator {
    constructor(private seed = 0) {}

    method(quality = "low") {}
}

const handlers = { onEvent(event = "default") {} };

type Callback = (attempt = 0) => void;
```

This covers function declarations, function expressions, arrow functions, class and object methods, constructors (including TypeScript parameter properties), setters, inline callbacks, and type-level signatures (function types, method signatures, construct signatures, `declare function`).

A default on a nested callback inside another default is reported as well, once per parameter:

```ts
function foo(callback = (attempt = 0) => attempt) {}
// two reports: `callback = ...` and `attempt = 0`
```

## Allowed patterns

Pass the argument explicitly at the call site:

```ts
function generatePlanet(seed: number, radius: number): Planet;

generatePlanet(worldSeed, EARTH_RADIUS);
```

Resolve a genuine configuration fallback inside the function body — this is not a parameter default and is allowed:

```ts
type RenderOptions = {
    shadowQuality?: number;
};

function render(scene: Scene, options?: RenderOptions): void {
    const shadowQuality = options?.shadowQuality ?? 2;
}
```

Optional parameters (`x?: number`) are not defaults and remain allowed; they are governed by the separate options-object policy. Destructuring defaults in variable declarations are also allowed, because they are not part of a signature:

```ts
const { a = 1 } = obj;
let [x = 2] = arr;
```

## Limitations

The rule is syntax-only. It matches assignment patterns structurally, so it does not need the type checker. There is no autofix because removing a default requires deciding where the value should come from at each call site. External library declarations (`.d.ts` in `node_modules`) are not linted, so signatures imposed by third-party typings are out of scope.
