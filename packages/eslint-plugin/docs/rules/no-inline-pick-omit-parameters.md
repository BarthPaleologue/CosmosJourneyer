# `no-inline-pick-omit-parameters`

Disallows inline `Pick<T, K>` and `Omit<T, K>` utility types in function parameter type annotations.

Inline utility types make signatures noisy and hide the meaning of a narrow contract behind structural TypeScript machinery. A named alias gives the contract a vocabulary of its own and lets the same contract be reused by callers and implementations.

## Rule details

The following parameter annotations are reported:

```ts
function foo(x: Pick<I18n, "registerLocales">) {}

const bar = (x: Omit<I18n, "locale">) => {};

function baz(x: Readonly<Pick<I18n, "registerLocales">>) {}
```

The rule also checks:

- Optional, default, rest, destructured, and TypeScript parameter-property parameters.
- Function declarations, expressions, arrow functions, class methods, constructors, overload signatures, interface method signatures, call signatures, constructors types, and function types.
- Nested occurrences such as `Readonly<Pick<...>>`, unions, intersections, arrays, and type-literal members inside a parameter annotation.

Return types, type aliases, class properties, interface properties, and standalone variable annotations are not reported.

## Allowed patterns

```ts
type LocaleRegistrar = Pick<I18n, "registerLocales">;

function foo(x: LocaleRegistrar) {}

type Other = Omit<I18n, "locale">;

function bar(x: Other) {}

function returnsPick(): Pick<I18n, "registerLocales"> {
    // ...
}

type CallbackReturn = () => Pick<I18n, "registerLocales">;

interface Contract {
    readonly value: Pick<I18n, "registerLocales">;
}
```

A function type's parameter annotation is still a parameter annotation, so the following is reported:

```ts
type Callback = (x: Pick<I18n, "registerLocales">) => void;
```

## Limitations

The rule is syntax-only and matches type references named `Pick` or `Omit`. A project-local type with either name would also be reported. There is no autofix because naming a reusable contract requires developer judgement.
