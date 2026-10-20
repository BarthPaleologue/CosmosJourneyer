# Cosmos Journeyer – Coding Agent Briefing

## Mission Overview

- Objective: contribute maintainable, testable code aligned with Cosmos Journeyer’s open-source vision of a cathedral-quality codebase capable of supporting the space-exploration experience for decades.
- Repo type: pnpm workspace with two primary products – the Babylon.js game and a Next.js website.
- Toolchain baseline: see root `package.json` engines for the current Node.js/pnpm versions; strict TypeScript across packages, strict linting via ESLint, formatting with Oxfmt.

## Repo Structure

The repo is organized as a pnpm workspace. Packages can be found under the `packages/` folder.

## Key Commands

Have a look at relevant `package.json` at root level and in relevant packages to find scripts.

## Documentation

Make sure you read and understand the root level `.md` files. Other `.md` files can be found in packages, read them as needed.

## Engineering Principles

The principles below cover rules that cannot be checked automatically by the linter. They complement the rules already enforced by the linter.

- **Composition over inheritance**: prefer interface-based composition (see `Transformable`) or discriminated unions. Inheritance hierarchies are discouraged (Rationale: inheritance is a trap that makes code harder to refactor when requirements inevitably change).

- **Explicit dependencies**: avoid hidden dependencies such as global mutable state (like singletons), prefer dependency injection instead. (Rationale: global mutable state makes code harder to test and reason about.)

- **Memory ownership**: always consider who owns what (think like Rust borrow checker), especially for GPU resources. Avoid leaking GPU resources (e.g., textures, buffers) by ensuring proper disposal patterns. (Rationale: GPU resources are limited and leaking them can lead to crashes or degraded performance.)

- **Read-only access**: express consumers' non-mutation contracts in function signatures with `Readonly<T>` or `ReadonlyArray<T>`. Use `DeepReadonly<T>` from `@cosmos-journeyer/typescript` when the contract also covers nested data. Keep shared data records mutable unless immutability is a domain invariant; newly created results belong to their recipient.

- **I18n aware**: Player-facing strings should be translated using i18next. (Rationale: hardcoded strings make localization difficult and error-prone.)

- **Type safety**: model known data with precise domain types; use `unknown` for unvalidated external data and narrow it at the boundary. Use `type` for data records and `interface` for contracts implemented by classes. Name types after their semantics and keep one canonical definition per contract.

- **Zod at the boundary, type safety inside**: parse and validate untrusted external data with Zod where it enters the application. Internal code trusts typed inputs and documented domain preconditions; do not repeat range, `NaN`, or infinity checks inside domain functions.

- **SI units**: internal physical calculations use SI units. Do not add unit suffixes to parameter or local variable names; document units in JSDoc instead. Convert to and from other units at input/output boundaries.

- **Git LFS for large assets**: use Git LFS for large binary assets (e.g., textures, models). (Rationale: Git LFS helps keep the repo size manageable and improves performance.)

- **Treat error as values**: prefer returning `Result<T, E>` or `T | undefined` instead of throwing exceptions. (Rationale: treating errors as values makes error handling more explicit and avoids crashing the game.)

## Development Workflow

- Review relevant docs above; confirm assumptions with existing implementations.
- Plan work with awareness of workspace structure (game vs website). Changes rarely span both simultaneously.
- Install dependencies (`pnpm install`).
- Incrementally develop in small, testable chunks.
- Write unit tests for new functionality or bug fixes by adding `*.spec.ts` files alongside implementation.
- Run **build**, then **unit tests**, then **lint** (allow ~1 minute), and finally **E2E tests** before opening a PR.
- When opening the PR, follow the template at `.github/PULL_REQUEST_TEMPLATE.md`. If you don't know the issue number, remove the "Related Tickets" section.

## Communication

- Do not hesitate to ask questions when in doubt.
- Use commit messages & descriptions to explain the intent of changes.
