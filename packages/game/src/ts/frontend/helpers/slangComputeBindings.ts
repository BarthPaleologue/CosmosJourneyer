//  This file is part of Cosmos Journeyer
//  SPDX-License-Identifier: AGPL-3.0-only

import type {
    ComputeBindingLocation,
    ComputeBindingMapping,
} from "@babylonjs/core/Engines/Extensions/engine.computeShader";
import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

interface SlangReflection {
    readonly parameters: ReadonlyArray<{
        readonly name?: string;
        readonly binding?: {
            readonly kind: string;
            readonly index?: number | string;
            readonly space?: number | string;
        };
        readonly type: { readonly kind: string };
    }>;
}

export function createComputeBindingMappingFromSlang(
    reflection: SlangReflection,
): Result<ComputeBindingMapping, Error> {
    const entries: Array<readonly [string, ComputeBindingLocation]> = [];

    for (const parameter of reflection.parameters) {
        if (parameter.type.kind !== "resource") {
            continue;
        }
        if (parameter.name === undefined) {
            return err(new Error("Slang reflection contains an unnamed resource"));
        }
        if (parameter.binding?.kind !== "descriptorTableSlot" || typeof parameter.binding.index !== "number") {
            return err(new Error(`Slang resource '${parameter.name}' has no descriptor table binding`));
        }
        if (parameter.binding.space !== undefined && typeof parameter.binding.space !== "number") {
            return err(new Error(`Slang resource '${parameter.name}' has an invalid descriptor set`));
        }

        entries.push([
            parameter.name,
            {
                group: parameter.binding.space ?? 0,
                binding: parameter.binding.index,
            },
        ]);
    }

    return ok(Object.fromEntries(entries));
}
