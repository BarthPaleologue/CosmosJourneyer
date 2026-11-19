# `no-pick-omit`

Disallows the `Pick<T, K>` and `Omit<T, K>` utility types in any type position.

Using `Pick` or `Omit` to carve a subset out of an existing type is a smell: it usually means the source type is doing too much, or that a dependency points in the wrong direction. Instead:

- **Consumer contracts**: the consumer defines its own interface, and the producer satisfies it structurally (dependency inversion). The dependency then points from the producer to the consumer's contract.
- **Foreign types** (DOM, Babylon, Electron, ...): define your own data type and convert explicitly with a cast function at the boundary.
- **Domain types**: refactor the type itself with an explicit sub-object (e.g. an orbital `plane` holding `inclination` and `longitudeOfAscendingNode`) so there is a single canonical definition.

## Rule details

Every type reference named `Pick` or `Omit` is reported, wherever it appears:

```ts
function foo(x: Pick<I18n, "registerLocales">) {}

type LocaleRegistrar = Pick<I18n, "registerLocales">;

function returnsPick(): Omit<I18n, "locale"> {
    // ...
}

interface Contract {
    readonly value: Readonly<Pick<I18n, "registerLocales">>;
}

const value: Omit<I18n, "locale"> = {} as Omit<I18n, "locale">;
```

This covers parameter annotations, return types, type aliases, class and interface members, variable annotations, generic constraints, and nested occurrences such as `Readonly<Pick<...>>`.

## Allowed patterns

```ts
// Consumer-side contract; the producer implements it structurally.
interface LocaleRegistrar {
    registerLocales(): void;
}

// Own data type for a foreign type, converted at the boundary.
type OriginLocation = {
    readonly hostname: string;
    readonly protocol: string;
};

function toOriginLocation(location: Location): OriginLocation {
    return { hostname: location.hostname, protocol: location.protocol };
}
```

## Limitations

The rule is syntax-only and matches type references named `Pick` or `Omit`. A project-local type with either name would also be reported. There is no autofix because replacing a utility type requires a design decision.
