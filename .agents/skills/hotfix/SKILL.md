---
name: hotfix
description: Prepare a Cosmos Journeyer maintenance release from a published tag by backporting selected fixes, aligning game release versions, validating the maintenance branch, and handing off for manual QA or an explicitly authorized release. Use for hotfix and patch-release preparation, not ordinary feature work on main.
---

# Hotfix

Prepare a minimal maintenance branch that can be released by exact commit SHA.
Keep release-specific inputs in the user's brief; do not reuse a previous release's
version, base SHA, PR list, exclusions, or QA results.

## Establish the release boundary

- Identify the published base tag, expected base SHA if supplied, target version,
  selected fixes and their order, exclusions, and the requested stopping point.
  Ask only for information that cannot be recovered from the brief or repository.
- Inspect Git status and existing worktrees before switching branches. Preserve
  unrelated changes and untracked files; use a separate worktree if necessary.
- Fetch tags and remote refs. Resolve the base tag to its commit and compare it
  with any supplied SHA. Stop on a mismatch rather than choosing a different base.
- Create `hotfix/v<target-version>` from that exact commit. Inspect an existing
  branch before reusing it; do not reset someone else's work.
- Read the current `RELEASING.md` and release workflow from `origin/main`, even when
  the published base has older tooling or no release guide. Read the base's package
  scripts for commands that can actually run there. Use the base's pinned toolchain
  and lockfile for its builds and tests.

The maintenance branch starts from the published version, not from `main`. Never
merge `main` into it. Never open a PR from this older tree directly into `main`;
use a maintenance base for review so intervening development is not reverted.

## Backport the selected behavior

Inspect each source PR's description, commits, final merged diff, and regression
tests. Read the code around the affected paths on the published base before applying
changes. A PR may contain an abandoned design subsequently replaced by another commit;
backport its final behavior.

Prefer small functional patches over blind cherry-picks. Adapt tests to the old
interfaces without importing entire architectural refactors. Keep fixes in the
requested order, preferably one commit per source PR, with source PR and commit
provenance in the commit message. Explain any omission or adaptation.

Preserve dependency versions, the lockfile, save formats, and unrelated behavior.
In particular, do not upgrade Babylon, Havok, or Electron to make a patch apply.
When a fix depends on newer library behavior, inspect the installed base version's
API and implementation and exercise it there. A matching type signature alone is
not proof of equivalent lifecycle or rendering behavior.

Document newly discovered unrelated bugs. If a correct backport requires a broader
change than authorized, explain the dependency and obtain a scope decision before
including it.

## Validate on the maintenance branch

Install with `pnpm install --frozen-lockfile`. Use the affected packages' available
scripts for build, typecheck, unit tests, and lint, plus the workspace format check
and `git diff --check`; follow repository ordering requirements. Adapt commands
missing on the tag without dropping the underlying validation.

- Run the regressions on the hotfix itself. Where practical, show that the relevant
  new tests fail against the previous implementation and pass with the fix.
- Separate pre-existing failures from regressions introduced by the patch. Report
  warnings and blocked checks accurately; do not change dependencies or unrelated
  code merely to make validation green.
- Ask Barth for explicit approval before launching any E2E, browser/game smoke
  test, or snapshot update, including targeted runs. Implementation authorization
  does not grant E2E permission. Select only flows plausibly affected by the diff.
- Prepare manual scenarios from the actual fixes and include loading a save from
  the published version. If the user will perform QA, hand off the local branch at
  the agreed point. Unit tests do not establish visual correctness or prove that
  a full saved game loads successfully.

Reread the final diff with the repository's coding and review principles. Check
that test coverage protects behavior and that adaptation has not pulled unrelated
changes from `main`. This author self-check is distinct from an independent review.

## Align game release versions

Make the version bump a separate commit after the fixes are validated. Inspect the
published release's version commit and current release checks to determine which
packages share the game version; do not assume that three manifests are the whole
set. Known places to inspect are:

- Root, game, and Electron `package.json` versions, which the release workflow
  requires to match.
- Internal workspace package versions aligned by prior game releases.

Search for remaining game release references. Distinguish them from historical
fixtures, examples, independent dependency/package versions, and website release
configuration; do not globally replace every matching number.

The website and game are independently deployable and follow separate release
flows. Do not update `packages/website/src/siteConfig.ts`, its desktop release
version, or download links as part of a game hotfix, even when they refer to an
older release. Website release changes belong to their own explicitly requested
workflow.

Check formatting and game version consistency after the bump. Confirm that dependency
specifications and lockfiles remain unchanged. If a missed game release reference is
found later, fold it into the version commit when authorized and appropriate for
the branch's publication state; do not silently rewrite published history.

## Handoff and release

Provide the branch, ordered commits, full tip SHA, fixes and source provenance,
adaptations, checks actually executed and their results, remaining manual scenarios,
residual limitations, and draft player-facing release notes. Mention any untracked
user files left untouched. Refresh the SHA after every amend or rebase.

Respect the requested stopping point and existing authorization. If local manual
QA precedes push, wait for the user's return before pushing. Do not infer permission
to deploy, merge, tag, or publish a release from permission to prepare the branch.

For an authorized release, follow the current `RELEASING.md`: run **Deploy Game
Release** using the workflow from `main`, supply the full hotfix SHA, and retain CI
validation. The workflow creates the version tag; do not create one manually.
Follow the documented dry run and draft-release procedure only when authorized.
