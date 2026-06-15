export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

export function ok<T, E>(value: T): Result<T, E> {
    return { success: true, value };
}

export function err<T, E>(error: E): Result<T, E> {
    return { success: false, error };
}

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export type DeepReadonly<T> = {
    readonly [K in keyof T]: DeepReadonly<T[K]>;
};

export type DeepMutable<T> = {
    -readonly [K in keyof T]: DeepMutable<T[K]>;
};

export type NonEmptyArray<T> = [T, ...T[]];

export function isNonEmptyArray<T>(arr: ReadonlyArray<T>): arr is NonEmptyArray<T> {
    return arr.length > 0;
}

export function arraysEqual<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function assertUnreachable(value: never): never {
    throw new Error(`Unexpected value: ${String(value)}`);
}

/** Strict (non-distributive) type equality that even distinguishes `any`. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/** Turns "should be true" into a compilation error when it's not. */
export type Assert<T extends true> = T;
