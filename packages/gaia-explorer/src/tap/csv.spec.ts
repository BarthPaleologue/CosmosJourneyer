import { describe, expect, it } from "vitest";

import { parseCsv } from "./csv";
describe("parseCsv", () => {
    it("handles quoted commas, quotes, empty values and CRLF", () => {
        expect(parseCsv('source_id,name,value\r\n2635476908753563008,"Alpha, ""A""",\r\n')).toEqual([
            { source_id: "2635476908753563008", name: 'Alpha, "A"', value: "" },
        ]);
    });
    it("rejects unclosed quotes", () => {
        expect(() => parseCsv('a\n"x')).toThrow();
    });
});
