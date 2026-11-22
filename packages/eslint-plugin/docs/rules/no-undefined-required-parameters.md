# `no-undefined-required-parameters`

Disallows required parameters whose type includes `undefined`.

A parameter declared as `T | undefined` pretends to be required while accepting the absence of a value — typically to trigger a hidden fallback such as `time ?? 0` inside the body. That recreates a default value in disguise and contradicts the explicit-signature policy: constitutive data must be required and defined, and optional knobs belong in a trailing `options?` object (see [`no-optional-parameters`](./no-optional-parameters.md)). Unions with `undefined` remain allowed in **return types** and in optional properties, where absence is genuine information.

## Rule details

The rule is **type-aware**: it resolves the parameter's type annotation through the TypeScript checker, so aliases of `T | undefined` are caught just like inline unions:

```ts
function simulate(time: number | undefined): void; // reported

type MaybeNumber = number | undefined;
function simulate(time: MaybeNumber): void; // reported: the alias hides the union

function createPlanet(mass: number | undefined, radius: number): Planet; // reported: mass

class Client {
    query(adql: string, signal: AbortSignal | undefined): void; // reported: signal
}

interface Service {
    run(attempt: number | undefined): void; // reported: type-level signature
}

type Callback = (error: Error | undefined) => void; // reported: function type
```

Only **explicitly annotated** parameters are checked. Parameters whose type is merely inferred — for example callbacks contextually typed by an external library — are exempt, because the signature is not authored by this codebase:

```ts
// markdown-it's RendererRule declares `env: Env | undefined`; the callback is not reported.
renderer.rules["link_open"] = (tokens, index, options, env, self) => self.renderToken(tokens, index, options);

[1, undefined].filter((value) => value !== undefined); // inferred parameter, not reported
```

Optional (`?`) parameters, parameters with default values, and rest parameters are not required parameters and are left to [`no-optional-parameters`](./no-optional-parameters.md) and [`no-default-parameters`](./no-default-parameters.md). Ambient `declare function` signatures are exempt because they describe external APIs.

This covers function declarations, function expressions, arrow functions, class and object methods, constructors (including TypeScript parameter properties), overload signatures, and type-level signatures (call signatures, function types, method signatures, construct signatures).

## Allowed patterns

```ts
function simulate(time: number): void;

function findPlanet(id: string): Planet | undefined; // undefined in the return type is fine

function render(scene: Scene, options?: RenderOptions): void; // optional knobs stay in options
```

## Exceptions

When absence is genuinely part of a function's contract — for example an adapter that returns `undefined` for an absent input, so the caller can skip a connection — a line-scoped disable with a technical justification is the sanctioned exception (see `parse` in `babylonjs-shading-language/src/bslInput.ts`):

```ts
export function parse(
    // eslint-disable-next-line cosmos/no-undefined-required-parameters -- An absent input is part of the contract: parse returns undefined so callers can skip the connection; this is not a hidden default.
    value: BslInput | undefined,
    options?: Partial<TargetOptions>,
): NodeMaterialConnectionPoint | undefined;
```

## Limitations

The rule checks the parameter's own type: a destructured parameter is reported only when the union with `undefined` sits on the whole pattern (e.g. `{ a }: Opts | undefined`), not on individual properties. There is no autofix because removing `| undefined` changes the contract at every call site.
