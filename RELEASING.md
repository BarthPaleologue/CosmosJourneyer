# Game releases

Open **Actions → Deploy Game Release → Run workflow** on GitHub. Keep **Use workflow from: main** to use the current workflow.

- **sha empty:** release the workflow's `main` commit without repeating full CI.
- **sha supplied:** release that exact commit after full CI passes, even if it is the tip of `main`.

The version comes from `packages/game/package.json` and must match the root and Electron package versions. The workflow rejects tags pointing to another commit.

For a hotfix, branch from the published version's commit, backport the fix, bump these three versions, and push. Supply the new branch tip's SHA.

Run with **dry_run = true** first, then **false** to deploy the web game and create the draft desktop release. Review and publish the draft. The workflow handles the new version tag.

The desktop Electron auto-updater only offers a release once it has been public on GitHub for at least **24 hours**. It checks again every four hours; if GitHub release metadata cannot be verified, the update remains hidden until a later successful check. Players can still download installers directly from GitHub immediately. Security hotfixes are also subject to this auto-update delay.
