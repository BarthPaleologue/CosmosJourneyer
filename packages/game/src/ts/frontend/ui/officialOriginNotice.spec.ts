import { describe, expect, it, vi } from "vitest";

import { createOfficialOriginNotice, isOfficialGameLocation } from "./officialOriginNotice";

vi.mock("@/i18n", () => ({
    default: {
        t: (): string => "Play at [cosmosjourneyer.com](https://cosmosjourneyer.com).",
    },
}));

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
        const notice = createOfficialOriginNotice({ protocol: "https:", hostname: "example.com" });
        const link = notice?.querySelector("a");

        expect(link?.href).toBe("https://cosmosjourneyer.com/");
        expect(link?.target).toBe("_blank");
        expect(link?.rel).toBe("noopener");
    });
});
