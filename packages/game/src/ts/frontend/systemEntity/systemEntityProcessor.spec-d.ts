import { expectTypeOf, test } from "vitest";

import type { AnySystemContentType, SystemEntity } from "./systemEntity";

test("erased entities cannot be passed to typed processors", () => {
    function assertProcessorErasureBoundary<T extends AnySystemContentType>(
        processor: (entity: SystemEntity<T>) => void,
        entity: SystemEntity,
    ): void {
        // @ts-expect-error An erased entity cannot safely be passed to a processor expecting SystemEntity<T>.
        processor(entity);
    }

    expectTypeOf(assertProcessorErasureBoundary).parameter(1).toEqualTypeOf<SystemEntity>();
});
