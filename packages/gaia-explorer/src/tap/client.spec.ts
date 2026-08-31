import { describe, expect, it } from "vitest";

import { createAsyncTapClient } from "./client";
import type { Fetch } from "./client";

describe("asynchronous TAP client", () => {
    it("creates, follows and retrieves a UWS job", async () => {
        const requests: string[] = [];
        const responses = [
            new Response(null, { status: 303, headers: { location: "/tap/async/42" } }),
            new Response(null, { status: 303 }),
            new Response("QUEUED"),
            new Response("COMPLETED"),
            new Response("source_id,name\n1,Sirius\n"),
        ];
        const fetchImplementation: Fetch = async (input) => {
            requests.push(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
            const response = responses.shift();
            if (response === undefined) {
                throw new Error("Unexpected request");
            }
            return await Promise.resolve(response);
        };
        const messages: string[] = [];
        const result = await createAsyncTapClient("https://example.test/tap/async", {
            fetchImplementation,
            logger: (message) => messages.push(message),
            pollIntervalMs: 0,
        }).query("SELECT source_id, name FROM stars");

        expect(result).toEqual({ success: true, value: [{ source_id: "1", name: "Sirius" }] });
        expect(requests).toEqual([
            "https://example.test/tap/async",
            "https://example.test/tap/async/42/phase",
            "https://example.test/tap/async/42/phase",
            "https://example.test/tap/async/42/phase",
            "https://example.test/tap/async/42/results/result",
        ]);
        expect(messages).toContain("TAP job phase: QUEUED");
        expect(messages).toContain("TAP job phase: COMPLETED");
    });

    it("returns the server error from a failed job", async () => {
        const responses = [
            new Response(null, { status: 303, headers: { location: "/tap/async/42" } }),
            new Response(null, { status: 303 }),
            new Response("ERROR"),
            new Response("Invalid ADQL"),
        ];
        const fetchImplementation: Fetch = async () => {
            const response = responses.shift();
            if (response === undefined) {
                throw new Error("Unexpected request");
            }
            return await Promise.resolve(response);
        };
        const result = await createAsyncTapClient("https://example.test/tap/async", {
            fetchImplementation,
            logger: () => undefined,
            pollIntervalMs: 0,
        }).query("broken");

        expect(result).toEqual({
            success: false,
            error: { kind: "protocol", message: "TAP job error: Invalid ADQL" },
        });
    });
});
