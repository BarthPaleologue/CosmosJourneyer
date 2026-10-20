import { expectTypeOf, test } from "vitest";

import type { AnySystemContentType, SystemEntity } from "./systemEntity";

test("erased entities cannot be passed to typed processors", () => {
    /**
     * Calls a typed processor with an erased entity to assert the type boundary.
     * @param processor Processor whose entity type is narrowed to `T`.
     * @param entity Entity widened to the system-entity union.
     */
    function assertProcessorErasureBoundary<T extends AnySystemContentType>(
        processor: (entity: SystemEntity<T>) => void,
        entity: SystemEntity,
    ): void {
        // @ts-expect-error An erased entity cannot safely be passed to a processor expecting SystemEntity<T>.
        processor(entity);
    }

    expectTypeOf(assertProcessorErasureBoundary).parameter(1).toEqualTypeOf<SystemEntity>();
});
