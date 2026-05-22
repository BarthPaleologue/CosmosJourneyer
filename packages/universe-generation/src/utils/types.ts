import type { DeepReadonly, NonEmptyArray } from "@cosmos-journeyer/universe-model";

export type { DeepReadonly, NonEmptyArray };

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export type Vector3Like = { x: number; y: number; z: number };

export function isNonEmptyArray<T>(arr: ReadonlyArray<T>): arr is NonEmptyArray<T> {
    return arr.length > 0;
}

export function assertUnreachable(value: never): never {
    throw new Error(`Unexpected value: ${String(value)}`);
}
