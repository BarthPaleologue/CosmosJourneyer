import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { SystemContentModel } from "@/backend/systemEntity/systemEntityModel";

import type { AnySystemContentType, SystemContentFactoryContext, SystemContentFactoryOf } from "./systemEntity";

export function assertErasureBoundary<T extends AnySystemContentType>(
    factory: SystemContentFactoryOf<T>,
    model: DeepReadonly<SystemContentModel>,
    context: SystemContentFactoryContext,
): void {
    // @ts-expect-error An erased model cannot safely be passed to a factory expecting the model associated with T.
    factory(model, context);
}
