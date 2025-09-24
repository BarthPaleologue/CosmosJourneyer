import { expect, test } from "vitest";

import { jsonSafeParse } from "./json";

test("jsonSafeParse returns object for valid JSON", () => {
    const result = jsonSafeParse('{"a":1,"b":"test"}');
    expect(result).toEqual({ a: 1, b: "test" });
});

test("jsonSafeParse returns null on invalid JSON", () => {
    expect(jsonSafeParse("invalid")).toBeNull();
});

test("jsonSafeParse returns null for non-object JSON", () => {
    expect(jsonSafeParse("123")).toBeNull();
    expect(jsonSafeParse("[1,2,3]")).toBeNull();
    expect(jsonSafeParse("null")).toBeNull();
});
