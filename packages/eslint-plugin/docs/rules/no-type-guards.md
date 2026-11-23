# `no-type-guards`

Disallows **written type predicates** — function return types of the form `value is T`.

A hand-written guard lets any function claim a narrowing that the compiler then trusts everywhere. The policy prefers explicit, checkable mechanisms instead:

- **Inferred type predicates** (TS 5.5+): leave the callback's return annotation off and let tsc infer `value is T` from the body. This is the preferred form for `filter`/`find` narrowing.
- **Validation of external data** belongs to a Zod schema at the boundary; the parsed result is already typed.
- **Runtime narrowing** of already-typed values uses `instanceof`, `typeof`, or discriminant checks at the use site.

## Rule details

The rule reports any function-like construct whose return type annotation is a type predicate:

```ts
function isRecord(value: unknown): value is Record<string, unknown>; // reported
const isNonEmpty = (arr: Array<number>): arr is [number, ...number[]] => arr.length > 0; // reported

rows.filter((star): star is Star => star !== undefined); // reported: inline predicate

interface Service {
    isReady(state: unknown): state is Ready; // reported: type-level signature
}
```

This covers function declarations, function expressions, arrow functions, class and object methods, overload signatures, and type-level signatures (call signatures, function types, method signatures).

## Allowed patterns

```ts
// Zod at the boundary: the parsed value is already typed.
const recordSchema = z.record(z.string(), z.unknown());
const parsed = recordSchema.safeParse(value);
if (!parsed.success) {
    return err("not a record");
}
parsed.data["key"]; // Record<string, unknown>, no guard needed

// instanceof / typeof narrowing at the use site.
if (control instanceof ButtonInputControl) {
    control.press(); // narrowed here, no written predicate
}

// Inferred predicate: no annotation, tsc narrows the filter result for you.
const defined = values.filter((value) => value !== undefined); // Star[]
const meshes = sections.filter((section) => section instanceof LandingBay);

// Collections without a natural predicate: flatMap.
const defined2 = values.flatMap((value) => (value === undefined ? [] : [value]));
```

## Limitations

The rule is syntax-only: it checks the written return type annotation. It cannot tell whether a predicate is sound — that is exactly why they are banned. There is no autofix because replacing a guard requires choosing the right validation or narrowing strategy per call site.
