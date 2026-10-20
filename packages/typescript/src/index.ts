export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

/**
 * @param value Successful result value.
 * @returns A success Result containing the value.
 */
export function ok<T, E>(value: T): Result<T, E> {
    return { success: true, value };
}

/**
 * @param error Failure value to preserve.
 * @returns A failure Result containing the error.
 */
export function err<T, E>(error: E): Result<T, E> {
    return { success: false, error };
}

/**
 * Converts a promise into a Result, preserving a rejection as its error value.
 * @param promise Promise whose outcome should be captured.
 * @returns A promise that resolves to the success or failure Result.
 */
export async function promiseToResult<T>(promise: Readonly<Promise<T>>): Promise<Result<T, unknown>> {
    try {
        return ok(await promise);
    } catch (cause) {
        return err(cause);
    }
}

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

type AnyFunction = (...args: ReadonlyArray<never>) => unknown;

export type DeepReadonly<T> = T extends Primitive | AnyFunction
    ? T
    : T extends ReadonlyMap<infer K, infer V>
      ? Readonly<ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>>
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

export type DeepMutable<T> = T extends Primitive | AnyFunction
    ? T
    : T extends object
      ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
      : T;

export type NonEmptyArray<T> = [T, ...T[]];

/**
 * @param arr Array to inspect.
 * @returns Whether the array has at least one element.
 */
export function isNonEmptyArray<T>(arr: ReadonlyArray<T>): arr is NonEmptyArray<T> {
    return arr.length > 0;
}

/**
 * Compares two arrays for equal length and element-by-element identity.
 * @param a First array to compare.
 * @param b Second array to compare.
 * @returns Whether both arrays have the same elements in the same order.
 */
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

/**
 * Marks a value as impossible after exhaustive handling of a union.
 * @param value Value whose type should be uninhabited.
 */
export function assertUnreachable(value: never): never {
    throw new Error(`Unexpected value: ${String(value)}`);
}

/** Strict (non-distributive) type equality that even distinguishes `any`. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/** Turns "should be true" into a compilation error when it's not. */
export type Assert<T extends true> = T;

declare const tag: unique symbol;

export type Tagged<T, TTag extends PropertyKey, TMetadata> = T & {
    readonly [tag]: Readonly<{
        Tag: TTag;
        Metadata: TMetadata;
    }>;
};

export type TagMetadataOf<T extends Tagged<unknown, PropertyKey, unknown>> =
    T extends Tagged<unknown, PropertyKey, infer TMetadata> ? TMetadata : never;

export type Brand<T, B extends PropertyKey> = Tagged<T, B, never>;
