import type { AnySystemContentType, SystemEntity } from "./systemEntity";

export function assertProcessorErasureBoundary<T extends AnySystemContentType>(
    processor: (entity: SystemEntity<T>) => void,
    entity: SystemEntity,
): void {
    // @ts-expect-error An erased entity cannot safely be passed to a processor expecting SystemEntity<T>.
    processor(entity);
}
