import { describe, expect, it } from "vitest";

import { isOfficialGameLocation } from "./officialOriginNotice";

describe("isOfficialGameLocation", () => {
    it.each([
        { protocol: "https:", hostname: "cosmosjourneyer.com" },
        { protocol: "http:", hostname: "localhost" },
        { protocol: "http:", hostname: "127.0.0.1" },
        { protocol: "app:", hostname: "bundle" },
    ])("accepts an official or local location", (location) => {
        expect(isOfficialGameLocation(location)).toBe(true);
    });

    it("rejects a third-party web origin", () => {
        expect(isOfficialGameLocation({ protocol: "https:", hostname: "barthpaleologue.github.io" })).toBe(false);
    });
});
