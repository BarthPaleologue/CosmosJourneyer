# `no-optional-parameters`

Disallows optional parameters (the `?` modifier), except for a **single last parameter named `options`**.

A signature should make the required data and the optional knobs immediately visible. Optional parameters scattered through a parameter list hide dependencies and business data behind a `?` that call sites can silently drop. The policy distinguishes:

- **Constitutive parameters** — always required.
- **Dependencies** — always explicit (required).
- **Knobs** — configurable but optional, grouped in a trailing `options` object.

## Rule details

The rule reports every parameter carrying the `?` modifier, unless it is the **last parameter** and is a **plain identifier named `options`**:

```ts
function generateTerrain(seed: number, radius?: number): Terrain; // reported: radius?
function render(scene: Scene, settings?: RenderSettings): void; // reported: not named options
function simulate({ dt }?: SimOptions): void; // reported: destructured optional parameter

class Client {
    query(adql: string, signal?: AbortSignal): void; // reported: signal?
}

type Callback = (attempt?: number) => void; // reported: type-level signature
```

This covers function declarations, function expressions, arrow functions, class and object methods, constructors (including TypeScript parameter properties), setters, inline callbacks, overload signatures, abstract and bodyless class methods, and type-level signatures (call signatures, function types, method signatures, construct signatures). Ambient `declare function` signatures are left alone because they describe external APIs.

## Allowed patterns

```ts
type TerrainOptions = Partial<{
    resolution: number;
    enableErosion: boolean;
}>;

function generateTerrain(seed: number, radius: number, options?: TerrainOptions): Terrain;

// Constitutive arguments stay required; only knobs go into options.
function render(scene: Scene, options?: RenderOptions): void {
    const shadowQuality = options?.shadowQuality ?? 2;
}
```

An explicit options type is preferred, but `Partial<T>` is allowed when it already exists:

```ts
function generateTerrain(seed: number, radius: number, options?: Partial<TerrainOptions>): Terrain;
```

## Limitations

The rule is syntax-only: it checks the `?` modifier, the parameter position, and the name `options`. It cannot verify that the `options` type is an object type, nor that its fields are genuine knobs rather than disguised required data — that remains a review concern. There is no autofix because moving a parameter into an options object changes every call site.
