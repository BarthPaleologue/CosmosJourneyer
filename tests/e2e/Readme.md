# End-to-End testing in Cosmos Journeyer

## Docker

If you don't want to setup playwright locally, you can run the tests in a docker container instead.

```sh
docker build -t cosmos-journeyer-e2e .
```

```sh
docker run --rm --ipc=host -e CI=1 \
  -v "$(pwd)/tests/e2e:/app/tests/e2e" \
  cosmos-journeyer-e2e \
  npx playwright test --reporter=list
```

```sh
docker run --rm --ipc=host -e CI=1 \
  -v "$(pwd)/tests/e2e:/app/tests/e2e" \
  cosmos-journeyer-e2e \
  npx playwright test --update-snapshots --reporter=list
```
