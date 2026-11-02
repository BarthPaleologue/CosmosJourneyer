//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, test } from "vitest";

import { createComputeBindingMappingFromSlang } from "./slangComputeBindings";

describe(createComputeBindingMappingFromSlang.name, () => {
    test("derives Babylon bindings from Slang descriptor slots", () => {
        const result = createComputeBindingMappingFromSlang({
            parameters: [
                {
                    name: "positions",
                    binding: { kind: "descriptorTableSlot", index: 2, space: 1 },
                    type: { kind: "resource" },
                },
                {
                    name: "params",
                    binding: { kind: "descriptorTableSlot", index: 3 },
                    type: { kind: "resource" },
                },
                {
                    name: "ignoredConstant",
                    binding: { kind: "uniform", index: 0 },
                    type: { kind: "scalar" },
                },
            ],
        });

        expect(result).toEqual({
            success: true,
            value: {
                positions: { group: 1, binding: 2 },
                params: { group: 0, binding: 3 },
            },
        });
    });

    test("rejects resources without a concrete descriptor slot", () => {
        const result = createComputeBindingMappingFromSlang({
            parameters: [
                {
                    name: "positions",
                    binding: { kind: "descriptorTableSlot", index: "unknown" },
                    type: { kind: "resource" },
                },
            ],
        });

        expect(result.success).toBe(false);
    });
});
