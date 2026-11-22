# `@cosmos-journeyer/eslint-plugin`

Project-specific ESLint rules for the Cosmos Journeyer monorepo. The package is private and is consumed directly from source by the root `eslint.config.mts`.

## Technology

- Node.js 24 native TypeScript type stripping: source and tests are `.mts` files and run without a transpilation step.
- TypeScript 6 with `tsc --noEmit` for type checking.
- ESLint 10 flat config.
- `@typescript-eslint/utils` for typed rule authoring.
- `@typescript-eslint/rule-tester` with the Node.js built-in test runner.

The package has no build step and no generated `dist/` directory.

## Rules

| Rule                                                               | Description                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| [`no-class-inheritance`](./docs/rules/no-class-inheritance.md)     | Disallow class inheritance via `extends`; prefer composition.     |
| [`no-default-parameters`](./docs/rules/no-default-parameters.md)   | Disallow default values in function parameters.                   |
| [`no-optional-parameters`](./docs/rules/no-optional-parameters.md) | Disallow optional parameters except a single trailing `options?`. |
| [`no-pick-omit`](./docs/rules/no-pick-omit.md)                     | Disallow the `Pick`/`Omit` utility types; define named types.     |
| [`no-promise-reject`](./docs/rules/no-promise-reject.md)           | Disallow direct calls to `Promise.reject()`.                      |
| [`no-undefined-arguments`](./docs/rules/no-undefined-arguments.md) | Disallow passing `undefined` explicitly as a call argument.       |

Rules are registered under the `cosmos/` namespace.

## Config preset

The plugin exposes a first-class flat configuration preset, `cosmos.configs.all`. It registers the plugin under the `cosmos` namespace and enables every rule in the registry at `"error"` severity. The rule list is generated from `Object.keys(plugin.rules)` with `Object.fromEntries`, so registering a rule is enough to enable it.

The root configuration consumes the preset through `extends` while retaining its existing file scoping:

```ts
const typeScriptWorkspaceRules = {
    files: ["packages/**/*.{ts,tsx,js,jsx,mts}"],
    extends: [cosmosPlugin.configs.all],
    // ...
};
```

Rule names are not repeated individually in the root configuration.

## Adding a rule

1. Create `src/rules/my-rule.mts` with a default export created through `src/utils/create-rule.mts`.
2. Add `src/rules/my-rule.test.mts` covering valid and invalid cases.
3. Register the rule explicitly in `src/index.mts`.
4. Add `docs/rules/my-rule.md` with purpose, examples, and limitations.
5. Run validation:

```bash
pnpm --filter @cosmos-journeyer/eslint-plugin typecheck
pnpm --filter @cosmos-journeyer/eslint-plugin test:unit
pnpm --filter @cosmos-journeyer/eslint-plugin lint
pnpm --filter @cosmos-journeyer/eslint-plugin format:check
```

The `all` preset picks up the new rule automatically; no root ESLint configuration change is required.

Explicit imports and registrations are intentional. There is no dynamic file discovery, plugin framework, or configuration generator.

## Authoring guidelines

- Use TypeScript AST types from `@typescript-eslint/utils`, not untyped ESTree nodes or `any`.
- Report diagnostics with typed `messageId` values.
- Provide `meta.type`, `meta.docs`, `meta.schema`, and `meta.messages`.
- Keep rules independently testable.
- Prefer syntax-only visitors. Only request type-checker services when a rule truly needs them.
- Use `Readonly<T>` in helper signatures when the helper does not mutate AST nodes.

## Scripts

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `pnpm test:unit`    | Run rule tests with Node's test runner.      |
| `pnpm typecheck`    | Type-check sources with `tsc --noEmit`.      |
| `pnpm lint`         | Lint the package with the repository config. |
| `pnpm format`       | Format with Oxfmt.                           |
| `pnpm format:check` | Check formatting with Oxfmt.                 |
