# `no-string-in`

Disallows `"key" in object` checks with a **string-literal key**.

Using `in` with a literal string as a makeshift type guard hides a structural assumption inside a boolean check: the compiler cannot verify it, and the narrowed type is only as good as the string. The policy prefers explicit, checkable mechanisms instead:

- **Validation of external data** belongs to a Zod schema at the boundary; the parsed result is already typed.
- **Discriminated unions**: give the union a proper discriminant property and check it (`obj.type === "..."` / `obj.type === undefined`) instead of probing for key presence.
- **Runtime narrowing** of class instances uses `instanceof`; primitives use `typeof`.
- **Own-property feature detection** can use `Object.hasOwn` (but note prototype methods, like `StorageManager.getDirectory`, are not own properties — prefer a Zod `z.function()` check there).

Dynamic keys (`key in obj`) and `for...in` loops are not affected.

## Rule details

The rule reports any binary `in` expression whose left operand is a string literal:

```ts
if ("name" in target) {
    /* reported */
}
const has = "connectTo" in value; // reported
return "storage" in navigator && "getDirectory" in navigator.storage; // reported twice
```

## Allowed patterns

```ts
// Zod at the boundary: the parsed value is already typed.
const releaseSchema = z.looseObject({ published_at: z.string(), draft: z.literal(false) });
const parsed = releaseSchema.safeParse(await response.json());
if (!parsed.success) {
    return false;
}
parsed.data.published_at; // string, no key probing needed

// Discriminant check on a properly discriminated union.
if (nearestObject.type === undefined) {
    return true; // SystemObject
}

// instanceof narrowing for class instances.
if (mirror instanceof Mesh) {
    mirror.thinInstanceCount;
}

// Dynamic keys and for...in are fine.
const has = key in obj;
for (const key in obj) {
    console.log(key);
}
```

## Limitations

The rule is syntax-only: it checks the left operand of `in` expressions. It does not catch `Reflect.has(obj, "key")` or `Object.hasOwn(obj, "key")` — those are deliberate escape hatches for genuine own-property checks. There is no autofix because replacing the check requires choosing the right strategy per call site.
