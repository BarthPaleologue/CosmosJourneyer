//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { StarSystemContentModel } from "@/backend/universe/universeBackend";

export type SystemView = {
    readonly model: DeepReadonly<StarSystemContentModel>;

    /**
     * Reads an orbital object's or entity placement's current scene-space position.
     * The returned position is borrowed and must not be mutated. It may change as the simulation advances.
     * @param id Identifier within the loaded system.
     * @returns Current position, or undefined if the identifier is not loaded.
     */
    getPosition(id: string): Readonly<Vector3> | undefined;
};

/**
 * Creates a read-only view with the same lifetime as the loaded system.
 * @param model Authoritative orbital and entity models.
 * @param placements Orbital and entity placement nodes indexed by their model IDs.
 * @returns System models and live position queries without exposing scene nodes.
 */
export function createSystemView(
    model: DeepReadonly<StarSystemContentModel>,
    placements: Iterable<readonly [string, TransformNode]>,
): SystemView {
    const placementsById = new Map(placements);
    return {
        model,
        getPosition: (id) => placementsById.get(id)?.getAbsolutePosition(),
    };
}
