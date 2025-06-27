//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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

export function assertUnreachable(value: never): never {
    throw new Error(`Unexpected value: ${String(value)}`);
}

/** Strict (non-distributive) type equality that even distinguishes `any`. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

/** Turns “should be true” into a compilation error when it’s not. */
export type Assert<T extends true> = T;

type BuildTuple<T, N extends number, Acc extends T[] = []> = Acc["length"] extends N
    ? Acc // Base case: if Acc already has length N, return it
    : BuildTuple<T, N, [T, ...Acc]>; // Otherwise, prepend T and recurse

export type FixedLengthArray<T, N extends number> = BuildTuple<T, N>;

export type PowerOfTwo =
    | 1
    | 2
    | 4
    | 8
    | 16
    | 32
    | 64
    | 128
    | 256
    | 512
    | 1_024
    | 2_048
    | 4_096
    | 8_192
    | 16_384
    | 32_768
    | 65_536
    | 131_072
    | 262_144
    | 524_288
    | 1_048_576
    | 2_097_152
    | 4_194_304
    | 8_388_608
    | 16_777_216
    | 33_554_432
    | 67_108_864
    | 134_217_728
    | 268_435_456
    | 536_870_912
    | 1_073_741_824;
