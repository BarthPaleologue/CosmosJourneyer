# `no-promise-reject`

Disallows calls to `Promise.reject()`.

Cosmos Journeyer models recoverable failures as returned values, typically with `Result` or `Promise<Result>`. Rejecting a promise bypasses that convention and makes failure handling implicit at every call site.

## Rule details

This rule reports direct calls whose callee is the non-computed member expression `Promise.reject`:

```ts
Promise.reject(new Error("unreachable"));
```

Optional chaining is still a direct call and is reported:

```ts
Promise?.reject(new Error("unreachable"));
Promise.reject?.(new Error("unreachable"));
```

## Allowed patterns

Calls that do not statically name the `Promise.reject` member are outside the rule's syntactic scope:

```ts
Promise.resolve(value);
Promise["reject"](new Error("computed member names are not inspected"));
globalThis.Promise.reject(new Error("not the global Promise identifier"));
other.Promise.reject(new Error("not the global Promise identifier"));
Promise.reject.call(Promise, new Error("not a direct call"));
```

This rule is intentionally syntax-only. It does not use the TypeScript type checker, so aliasing the global `Promise` or shadowing it with a local binding is not detected.
