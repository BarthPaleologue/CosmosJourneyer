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

export type NonEmptyArray<T> = [T, ...T[]];

export function isNonEmptyArray<T>(arr: ReadonlyArray<T>): arr is NonEmptyArray<T> {
    return arr.length > 0;
}

type BuildTuple<T, N extends number, Acc extends T[] = []> = Acc["length"] extends N
    ? Acc // Base case: if Acc already has length N, return it
    : BuildTuple<T, N, [T, ...Acc]>; // Otherwise, prepend T and recurse

export type FixedLengthArray<T, N extends number> = BuildTuple<T, N>;
