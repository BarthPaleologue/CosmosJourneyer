import { describe, expect, it } from "vitest";

import { createFileKey } from "./state";

describe("state helpers", () => {
    it("creates distinct keys for files with identical metadata", () => {
        const first = new File(["abcd"], "texture.png", {
            type: "image/png",
            lastModified: 123,
        });
        const second = new File(["wxyz"], "texture.png", {
            type: "image/png",
            lastModified: 123,
        });

        const firstKey = createFileKey(first);
        const secondKey = createFileKey(second);

        expect(firstKey).not.toBe(secondKey);
    });
});
