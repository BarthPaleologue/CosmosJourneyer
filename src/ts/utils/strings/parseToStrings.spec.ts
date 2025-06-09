import { expect, test } from "vitest";

import i18n from "@/i18n";

import { parseSecondsPrecise } from "./parseToStrings";

// Regression test for handling durations shorter than one second

test("parseSecondsPrecise handles sub-second durations", () => {
    const originalT = i18n.t.bind(i18n);
    try {
        // simple mock translation function
        i18n.t = (key: string, options?: { count?: number }) => {
            if (key === "units:seconds") {
                return `${options?.count ?? 0} seconds`;
            }
            return "";
        };

        const result = parseSecondsPrecise(0.5);
        expect(result).toBe("0 seconds");
    } finally {
        i18n.t = originalT;
    }
});
