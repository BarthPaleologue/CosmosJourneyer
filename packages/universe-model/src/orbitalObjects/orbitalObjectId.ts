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

import { z } from "zod";

import type { OrbitalObjectType } from "./index";

export const OrbitalObjectIdSchema = z.string();

/**
 * Unique ID for an orbital object within a solar system
 */
export type OrbitalObjectId = z.infer<typeof OrbitalObjectIdSchema>;

/**
 * Creates a stable identifier from the parent path, object type, and sibling index.
 * @param parentIds Identifier path of the object's parent bodies.
 * @param type Type of orbital object being identified.
 * @param index Zero-based index among siblings of the same type.
 * @returns The serialized orbital object identifier.
 */
export function createOrbitalObjectId(
    parentIds: ReadonlyArray<OrbitalObjectId>,
    type: OrbitalObjectType,
    index: number,
): OrbitalObjectId {
    return `[${parentIds.join("|")}]->${type}${index}`;
}

/**
 * @param a First identifier to compare.
 * @param b Second identifier to compare.
 * @returns Whether the identifiers match.
 */
export function orbitalObjectIdEquals(a: OrbitalObjectId, b: OrbitalObjectId): boolean {
    return a === b;
}
