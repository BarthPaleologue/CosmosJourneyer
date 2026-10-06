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
import { TargetType } from "@/frontend/targeting/target";

import type { GameModule } from "../gameModule";
import { Monolith } from "./entity";
import type { MonolithModel } from "./entity";

export const MonolithModule: GameModule = {
    id: "monolith",
    setup: ({ systemEntities, targeting }): void => {
        const type = makeSystemContentType<MonolithModel, Monolith>("monolith");

        systemEntities.registerContentFactory(type, (model, context) => ok(new Monolith(context.scene)));

        systemEntities.registerUpdate(type, (monolith, context) => {
            monolith.content.update(context.observerPosition);
        });

        targeting.systemEntities.register(type, (monolith) => {
            return [
                {
                    type: TargetType.ANOMALY,
                    properName: monolith.model.name,
                    getTransform: () => monolith.placement.getTransform(),
                    getBoundingRadius: () => 10e3,
                },
            ];
        });
    },
};
