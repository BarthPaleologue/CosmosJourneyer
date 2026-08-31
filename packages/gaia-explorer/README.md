# Gaia Explorer

Source-only TypeScript library for querying the official [Gaia TAP service](https://gea.esac.esa.int/tap-server/tap), enriching its results through the official [SIMBAD TAP service](https://simbad.cds.unistra.fr/simbad/sim-tap), and transforming the resulting stellar data.

The package is consumed directly from `src/index.ts` by workspace tooling. It intentionally exposes no compiled build or executable: consumers compose the library operations needed by their universe-generation workflow.

Gaia uses asynchronous TAP jobs by default, while SIMBAD uses synchronous TAP queries. Both clients provide their official endpoint out of the box and accept an alternative endpoint, timeout, `fetch` implementation, and logger:

```ts
import { createGaiaClient, createSimbadClient } from "@cosmos-journeyer/gaia-explorer";

const logger = (message: string): void => console.info(message);
const gaia = createGaiaClient({ logger });
const simbad = createSimbadClient({ logger });

const gaiaRows = await gaia.query({ radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 });
if (!gaiaRows.success) {
    console.error(gaiaRows.error);
} else {
    const metadata = await simbad.query(gaiaRows.value);
    // Compose temperature resolution, classification, spatial binning and output as needed.
}
```

The offline integration test in `src/library.integration.spec.ts` demonstrates the complete public API path from the two catalog queries to a validated spatial dataset.

## Development

Consumers that call Gaia or SIMBAD require Internet access; tests are offline and deterministic.

```sh
pnpm install
pnpm --filter @cosmos-journeyer/gaia-explorer test:unit
pnpm --filter @cosmos-journeyer/gaia-explorer typecheck
pnpm --filter @cosmos-journeyer/gaia-explorer lint
pnpm --filter @cosmos-journeyer/gaia-explorer format:check
```
