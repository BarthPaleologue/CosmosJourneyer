import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { expectTypeOf, test } from "vitest";

import type { SystemContentModel } from "@/backend/systemEntity/systemEntityModel";

import type { AnySystemContentType, SystemContentFactoryContext, SystemContentFactoryOf } from "./systemEntity";

test("erased models cannot be passed to typed content factories", () => {
    /**
     * Calls a typed factory with an erased model to assert the type boundary.
     * @param factory Factory whose model type is narrowed to `T`.
     * @param model Model widened to the system-content union.
     * @param context Context passed to the factory.
     */
    function assertErasureBoundary<T extends AnySystemContentType>(
        factory: SystemContentFactoryOf<T>,
        model: DeepReadonly<SystemContentModel>,
        context: SystemContentFactoryContext,
    ): void {
        // @ts-expect-error An erased model cannot safely be passed to a factory expecting the model associated with T.
        factory(model, context);
    }

    expectTypeOf(assertErasureBoundary).parameter(1).toEqualTypeOf<DeepReadonly<SystemContentModel>>();
});
