# Game releases

Open **Actions → Deploy Game Release → Run workflow** on GitHub. Keep **Use workflow from: main** to use the current workflow.

- **sha empty:** release the workflow's `main` commit without repeating full CI.
- **sha supplied:** release that exact commit after full CI passes, even if it is the tip of `main`.

The version comes from `packages/game/package.json` and must match the root and Electron package versions. The workflow rejects tags pointing to another commit.

For a hotfix, branch from the published version's commit, backport the fix, bump these three versions, and push. Supply the new branch tip's SHA.

Run with **dry_run = true** first, then **false** to deploy the web game and create the draft desktop release. Review and publish the draft. The workflow handles the new version tag.
