import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { createOfficialOriginNotice, isOfficialGameLocation } from "./officialOriginNotice";

const t = await createInstance().init({
    lng: "en-US",
    resources: {
        "en-US": {
            common: {
                unofficialOriginNotice: "Play at [cosmosjourneyer.com](https://cosmosjourneyer.com).",
            },
        },
    },
});

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

    it("renders the translated Markdown link safely", () => {
        const notice = createOfficialOriginNotice(t, { protocol: "https:", hostname: "example.com" });
        const link = notice?.querySelector("a");

        expect(link?.href).toBe("https://cosmosjourneyer.com/");
        expect(link?.target).toBe("_blank");
        expect(link?.rel).toBe("noopener");
    });
});
