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

import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";

import { newSeededBlackHoleModel } from "./stellarObjects/blackHole/blackHoleModel";
import { newSeededTelluricPlanetModel } from "./planets/telluricPlanet/telluricPlanetModel";
import { StarSystemModel } from "./starSystem/starSystemModel";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

const scene = starSystemView.scene;

const blackHoleModel = newSeededBlackHoleModel(42, "Gargantua", []);

const millerPlanetModel = newSeededTelluricPlanetModel(42, "Miller", [blackHoleModel]);

const starSystemModel: StarSystemModel = {
    name: "Black Hole Demo",
    coordinates: {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    },
    subSystems: [
        {
            stellarObjects: [blackHoleModel],
            planetarySystems: [{ planets: [millerPlanetModel], satellites: [], spaceStations: [] }],
            anomalies: [],
            spaceStations: []
        }
    ]
};

const starSystem = await starSystemView.loadStarSystem(starSystemModel);

engine.init(true);

await starSystemView.switchToDefaultControls(true);

const BH = starSystem.getStellarObjects()[0];

starSystemView.getDefaultControls().speed = BH.getBoundingRadius();

positionNearObjectBrightSide(scene.getActiveControls(), BH, starSystem, 20);
