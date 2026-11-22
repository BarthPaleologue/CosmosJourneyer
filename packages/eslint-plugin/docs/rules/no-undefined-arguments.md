# `no-undefined-arguments`

Disallows passing `undefined` explicitly as a call argument — written directly (`undefined`) or as `void 0` — including as a value inside an object literal passed as an argument.

Transmitting `undefined` to ask a function to use a default value is an implicit protocol: it bypasses the obligation to provide arguments explicitly. The absence of an option must be expressed by **omitting** it, never by passing an explicit marker.

## Rule details

The rule reports `undefined` and `void 0` in the arguments of call and `new` expressions, recursing into object literals used as arguments:

```ts
generateTerrain(seed, radius, undefined); // reported
generateTerrain(seed, radius, void 0); // reported
new Client(undefined); // reported
generateTerrain(seed, radius, { resolution: undefined }); // reported
generateTerrain(seed, radius, { nested: { resolution: undefined } }); // reported
```

## Allowed patterns

Omit the argument or the option instead:

```ts
generateTerrain(seed, radius);
generateTerrain(seed, radius, { resolution: 128 });
```

`undefined` remains legitimate outside call arguments: search results without a match, optional properties, and values whose absence carries business meaning (for example a `Result<T | undefined, E>` value). Such cases may keep `undefined` — just not as an explicit call argument, where a targeted `eslint-disable-next-line` with a justification is acceptable for external APIs whose middle parameters cannot be skipped otherwise.

## Limitations

The rule is syntax-only: it flags the literal `undefined` and `void 0`. It cannot detect expressions that merely _may_ evaluate to `undefined` (a variable, a ternary, a call result) — narrowing those is the type system's job. There is no autofix because removing an argument changes the callee's arity.
