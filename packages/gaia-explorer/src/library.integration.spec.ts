import { describe, expect, it } from "vitest";

import {
    buildOutput,
    classifyStar,
    createGaiaClient,
    createSimbadClient,
    GaiaTapAsyncEndpoint,
    resolveTemperatureOverrides,
    rowsToStars,
    SimbadTapSyncEndpoint,
    SpatialBinner,
    validateDataset,
} from "./index";
import type { Fetch, GaiaSourceId, StarNature } from "./index";

describe("public library API", () => {
    it("queries, enriches and transforms Gaia rows into a validated dataset", async () => {
        let gaiaPhase = "QUEUED";
        const fetchImplementation: Fetch = async (input) => {
            const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
            if (url === GaiaTapAsyncEndpoint) {
                return await Promise.resolve(
                    new Response(null, { status: 303, headers: { location: `${GaiaTapAsyncEndpoint}/1` } }),
                );
            }
            if (url === `${GaiaTapAsyncEndpoint}/1/phase`) {
                if (gaiaPhase === "QUEUED") {
                    gaiaPhase = "COMPLETED";
                    return await Promise.resolve(new Response(null, { status: 303 }));
                }
                return await Promise.resolve(new Response("COMPLETED"));
            }
            if (url === `${GaiaTapAsyncEndpoint}/1/results/result`) {
                return await Promise.resolve(
                    new Response(
                        "source_id,designation,ra,dec,parallax,parallax_over_error,ruwe,bp_rp,teff_k\n" +
                            "2635476908753563008,Gaia DR3 2635476908753563008,0,0,200,20,1.0,1.5,\n",
                    ),
                );
            }
            if (url === SimbadTapSyncEndpoint) {
                return await Promise.resolve(
                    new Response(
                        "input_id,main_id,ids,spectral_type,object_type,effective_temperature\n" +
                            'Gaia DR3 2635476908753563008,GJ 699,"NAME Barnard\'s Star|GJ 699",M4V,PM*,3195\n',
                    ),
                );
            }
            throw new Error(`Unexpected request to ${url}`);
        };
        const clientOptions = { fetchImplementation, logger: (): void => undefined };
        const gaiaResult = await createGaiaClient({ ...clientOptions, pollIntervalMs: 0 }).query({
            radiusLy: 50,
            parallaxOverErrorMin: 10,
            ruweMax: 10,
        });
        if (!gaiaResult.success) {
            throw new Error(gaiaResult.error.message);
        }
        const simbadResult = await createSimbadClient(clientOptions).query(gaiaResult.value);
        if (!simbadResult.success) {
            throw new Error(simbadResult.error.message);
        }
        const temperatures = resolveTemperatureOverrides(gaiaResult.value, simbadResult.value);
        const names = new Map<GaiaSourceId, string>(
            [...simbadResult.value].map(([sourceId, metadata]) => [sourceId, metadata.name]),
        );
        const natures = new Map<GaiaSourceId, StarNature>(
            [...simbadResult.value].map(([sourceId, metadata]) => [sourceId, classifyStar(metadata)]),
        );
        const binner = new SpatialBinner({ gridSize: 5, halfExtent: 50 });
        for (const star of rowsToStars(gaiaResult.value, names, temperatures, natures)) {
            binner.addStar(star);
        }
        const payload = buildOutput(
            binner.cubes,
            { gridSize: 5, halfExtent: 50 },
            { radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 },
            gaiaResult.value.length,
            1,
        );

        expect(validateDataset(payload).success).toBe(true);
        expect(payload.cubes["3:0:0"]?.stars[0]).toMatchObject({
            name: "Barnard's Star",
            temperature: 3195,
            nature: "main-sequence",
        });
    });
});
