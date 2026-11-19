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

import { ok } from "@cosmos-journeyer/typescript";

import { makeSystemContentType } from "@/frontend/systemEntity/systemEntity";

import type { GameModule } from "../gameModule";
import { getStellarWindSources } from "../stellarWindSources";
import { MagnetosphereGizmo } from "./magnetosphereGizmo";
import { generateMagnetosphereGizmoModels } from "./magnetosphereGizmoModel";
import type { MagnetosphereGizmoModel } from "./magnetosphereGizmoModel";

export const MagnetosphereGizmoModule: GameModule = {
    id: "magnetosphereGizmo",
    setup: ({ systemEntities }) => {
        const type = makeSystemContentType<MagnetosphereGizmoModel, MagnetosphereGizmo>("magnetosphereGizmo");
        systemEntities.registerProcedural(({ system }) => generateMagnetosphereGizmoModels(system));
        systemEntities.registerContentFactory(type, ({ content }, { scene }) => {
            return ok(new MagnetosphereGizmo(content.radius, content.magneticField, scene));
        });
        systemEntities.registerUpdate(type, (entity, { system }) => {
            entity.content.update(getStellarWindSources(system));
        });
    },
};
