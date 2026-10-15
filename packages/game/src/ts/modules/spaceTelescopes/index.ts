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

import { err, ok } from "@cosmos-journeyer/typescript";

import { makeSystemContentType } from "@/frontend/systemEntity/systemEntity";
import { TargetType } from "@/frontend/targeting/target";

import type { GameModule } from "../gameModule";
import { SpaceTelescope } from "./spaceTelescope";
import { SpaceTelescopeModelSchema } from "./spaceTelescopeModel";
import type { SpaceTelescopeModel } from "./spaceTelescopeModel";

export const SpaceTelescopesModule: GameModule = {
    id: "space-telescopes",
    setup: ({ systemEntities, targeting, rendering }): void => {
        const type = makeSystemContentType<SpaceTelescopeModel, SpaceTelescope>("spaceTelescope");
        systemEntities.registerContentFactory(type, (model, { scene }) => {
            const parsed = SpaceTelescopeModelSchema.safeParse(model);
            if (!parsed.success) {
                return err(new Error(`Invalid space telescope model: ${parsed.error.message}`));
            }
            return ok(new SpaceTelescope(parsed.data, scene));
        });
        targeting.systemEntities.register(type, (entity) => [
            {
                type: TargetType.CUSTOM,
                properName: entity.model.name,
                getTransform: () => entity.content.getTransform(),
                getBoundingRadius: () => entity.content.radius,
            },
        ]);
        rendering.shadows.systemEntities.registerShadowCasters(type, (entity) => [entity.content.getTransform()]);
    },
};
