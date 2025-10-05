# End-to-End testing in Cosmos Journeyer

Cosmos Journeyer uses [Playwright](https://playwright.dev/) for end-to-end testing. The tests are located in the `packages/game/tests/e2e` directory.

## Writing tests

You can write end-to-end tests in `packages/game/tests/e2e` using Playwright's API. You can have a look at `default.spec.ts` for an example of how to write a test.

Screenshots are stored in folders next to the test files. The screenshots are versioned using git-lfs, so you need to have git-lfs installed and configured to use them.

## Git LFS

You need to have [git-lfs](https://git-lfs.github.com/) installed and configured to use the screenshots. You can install it using the following command:

```bash
git lfs install
```

Then, you can pull the screenshots using the following command:

```bash
git lfs pull
```

## Run locally

To run the tests locally, you need to have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed. You can install pnpm globally using npm:

```bash
npm install -g pnpm
```

Then, you can install the dependencies and run the tests:

```bash
pnpm install
```

then install the playwright browsers:

```bash
pnpm playwright install
```

Finally, you can run the tests:

```bash
pnpm test:e2e
```

## Run in Docker

If you can't or don't want to setup playwright locally, you can run the tests in a docker container instead:

```bash
pnpm test:e2e:docker
```
