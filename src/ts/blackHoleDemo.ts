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

import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { CustomStarSystemModel } from "./starSystem/customStarSystemModel";

import { newSeededBlackHoleModel } from "./stellarObjects/blackHole/blackHoleModel";
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

const scene = starSystemView.scene;

const blackHoleModel = newSeededBlackHoleModel(42, "Gargantua", null);

const millerPlanetModel = newSeededTelluricPlanetModel(42, "Miller", blackHoleModel);

const starSystemModel = new CustomStarSystemModel(
    "Black Hole Demo",
    {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    },
    [blackHoleModel],
    [{ planet: millerPlanetModel, satellites: [] }],
    []
);
const starSystem = new StarSystemController(starSystemModel, scene);

await starSystemView.loadStarSystem(starSystem, true);

engine.init(true);

await starSystemView.switchToDefaultControls(true);

const BH = starSystem.stellarObjects[0];

starSystemView.getDefaultControls().speed = BH.getBoundingRadius();

positionNearObjectBrightSide(scene.getActiveControls(), BH, starSystem, 20);
