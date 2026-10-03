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

import { hashArray } from "@/utils/hash";

import type { GameModule } from "../gameModule";
import { DarkKnight } from "./darkKnight";
import { createDarkKnightOrbitalPlacementModel } from "./darkKnightModel";
import type { DarkKnightModel } from "./darkKnightModel";

export const DarkKnightModule: GameModule = {
    id: "dark-knight",
    setup: ({ systemEntities, targeting, music }): void => {
        const type = makeSystemContentType<DarkKnightModel, DarkKnight>("darkKnight");

        systemEntities.registerProcedural(({ system }) => {
            if (
                hashArray([
                    system.coordinates.starSectorX,
                    system.coordinates.starSectorY,
                    system.coordinates.starSectorZ,
                    system.coordinates.localX,
                    system.coordinates.localY,
                    system.coordinates.localZ,
                ]) > 0.05
            ) {
                return [];
            }

            const stellarIds = system.stellarObjects.map((stellarObject) => stellarObject.id);

            return [
                {
                    id: "darkKnight",
                    name: "Dark Knight",
                    content: {
                        type: "darkKnight",
                    },
                    placement: createDarkKnightOrbitalPlacementModel(stellarIds),
                },
            ];
        });

        systemEntities.registerContentFactory(type, (model, context) => ok(new DarkKnight(context.scene)));

        targeting.systemEntities.register(type, (darkKnight) => {
            return [
                {
                    type: TargetType.ANOMALY,
                    properName: darkKnight.model.name,
                    getTransform: () => darkKnight.placement.getTransform(),
                    getBoundingRadius: () => darkKnight.content.radius,
                },
            ];
        });

        music.systemEntities.register(type, (darkKnight, { distance }) => {
            if (distance < darkKnight.content.radius * 100) {
                return ["spacialWinds", "echoesOfTime"];
            }

            return [];
        });
    },
};
