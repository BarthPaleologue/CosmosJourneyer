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

import { LoadAssetContainerAsync } from "@babylonjs/core/Loading";

import { makeSystemContentType } from "@/frontend/systemEntity/systemEntity";
import { TargetType } from "@/frontend/targeting/target";

import type { GameModule } from "../gameModule";
import teapotPath from "./assets/teapot.glb";
import { RussellTeaPot } from "./russellTeaPot";
import { russellTeapotAssetId } from "./russellTeaPotModel";
import type { RussellTeaPotModel } from "./russellTeaPotModel";

export const RussellTeaPotModule: GameModule = {
    id: "russell-teapot",
    setup: ({ assets, systemEntities, targeting }): void => {
        assets.registerContainer(russellTeapotAssetId, async (scene) => {
            return await LoadAssetContainerAsync(teapotPath, scene);
        });

        const type = makeSystemContentType<RussellTeaPotModel, RussellTeaPot>("russellTeaPot");
        systemEntities.registerSpatialGeometry(type, (entity) => ({
            getTransform: () => entity.content.getTransform(),
            getBoundingRadius: () => entity.content.radius,
        }));
        systemEntities.registerContentFactory(type, (_model, context) => RussellTeaPot.New(context.moduleAssets));

        systemEntities.registerUpdate(type, (entity, context) => {
            entity.content.update(context.observerPosition);
        });

        targeting.systemEntities.register(type, (entity) => [
            {
                type: TargetType.CUSTOM,
                properName: entity.model.name,
                getTransform: () => entity.content.getTransform(),
                getBoundingRadius: () => entity.content.radius,
            },
        ]);
    },
};
