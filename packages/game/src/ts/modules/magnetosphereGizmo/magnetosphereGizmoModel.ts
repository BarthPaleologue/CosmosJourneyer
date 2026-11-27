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

import type { Meters } from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { MagneticFieldModel, StarSystemModel } from "@cosmos-journeyer/universe-model";

import type { InFramePlacementModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

export type MagnetosphereGizmoModel = {
    type: "magnetosphereGizmo";
    radius: Meters;
    magneticField: MagneticFieldModel;
};

/**
 * @param system System whose bodies may have a magnetic field.
 * @returns One debug entity for each magnetized planet or satellite.
 */
export function generateMagnetosphereGizmoModels(
    system: DeepReadonly<StarSystemModel>,
): Array<SystemEntityModel<MagnetosphereGizmoModel, InFramePlacementModel>> {
    const models: Array<SystemEntityModel<MagnetosphereGizmoModel, InFramePlacementModel>> = [];
    for (const body of [...system.planets, ...system.satellites]) {
        if (body.magneticField === null) {
            continue;
        }
        models.push({
            id: `magnetosphereGizmo:${body.id}`,
            name: body.name,
            content: {
                type: "magnetosphereGizmo",
                radius: body.radius,
                magneticField: structuredClone(body.magneticField),
            },
            placement: { type: "inFrame", parentId: body.id },
        });
    }
    return models;
}
