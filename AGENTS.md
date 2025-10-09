# Cosmos Journeyer – Coding Agent Briefing

## Mission Overview

- Objective: contribute maintainable, testable code aligned with Cosmos Journeyer’s open-source vision of a cathedral-quality codebase capable of supporting the space-exploration experience for decades.
- Repo type: pnpm workspace with two primary products – the Babylon.js game and a Next.js website.
- Toolchain baseline: Node.js ≥ 20, pnpm ≥ 10, strict TypeScript across packages, strict linting via ESLint, formatting with Prettier.

## Repo Structure

The repo is organized as a pnpm workspace. Packages can be found under the `packages/` folder.

## Key Commands

Have a look at relevant `package.json` at root level and in relevant packages to find scripts.

## Documentation

Make sure you read and understand the root level `.md` files. Other `.md` files can be found in packages, read them as needed.

## Engineering Principles

- **Composition over inheritance**: prefer interface-based composition (see `Transformable`) or discriminated unions. Inheritance hierarchies are discouraged (Rationale: inheritance is a trap that makes code harder to refactor when requirements inevitably change).

- **No circular dependencies**: dependency cycles are forbidden per ESLint `import/no-cycle` rule. (Rationale: cycles creates coupling between components that should be independently testable and maintainable.)

- **Explicit dependencies**: avoid hidden dependencies such as global mutable state (like singletons), prefer dependency injection instead. (Rationale: global mutable state makes code harder to test and reason about.)

- **Memory ownership**: always consider who owns what (think like Rust borrow checker), especially for GPU resources. Avoid leaking GPU resources (e.g., textures, buffers) by ensuring proper disposal patterns. (Rationale: GPU resources are limited and leaking them can lead to crashes or degraded performance.)

- **Immutability**: prefer `const`, `readonly` and `ReadonlyArray<T>` where possible. (Rationale: immutability makes code easier to reason about and reduces side effects.)

- **I18n aware**: Player-facing strings should be translated using i18next. (Rationale: hardcoded strings make localization difficult and error-prone.)

- **Type safety**: always prefer strong typing over `any` or `unknown`. Use TypeScript features like union types, intersection types, and generics to model complex data structures. (Rationale: strong typing helps catch errors at compile time and improves code readability.)

- **Git LFS for large assets**: use Git LFS for large binary assets (e.g., textures, models). (Rationale: Git LFS helps keep the repo size manageable and improves performance.)

## Development Workflow

- Review relevant docs above; confirm assumptions with existing implementations.
- Plan work with awareness of workspace structure (game vs website). Changes rarely span both simultaneously.
- Install dependencies (`pnpm install`).
- Incrementally develop in small, testable chunks.
- Write unit tests for new functionality or bug fixes by adding `*.spec.ts` files alongside implementation.
- Run **build**, then **unit tests**, then **lint** (allow ~1 minute), and finally **E2E tests via Docker** before opening a PR.
- When opening the PR, follow the template at `.github/PULL_REQUEST_TEMPLATE.md`. If you don't know the issue number, remove the "Related Tickets" section.

## Communication

- Do not hesitate to ask questions when in doubt.
- Use commit messages & descriptions to explain the intent of changes.
