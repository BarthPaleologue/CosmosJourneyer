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

import "@styles/index.css";

import { newSeededBlackHoleModel } from "@/backend/universe/proceduralGenerators/stellarObjects/blackHoleModelGenerator";
import { newSeededTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";

import { positionNearObjectBrightSide } from "@/frontend/helpers/positionNearObject";

import { CosmosJourneyer } from "./frontend/cosmosJourneyer";

const engine = await CosmosJourneyer.CreateAsync();
engine.setAutoSaveEnabled(false);

const starSystemView = engine.starSystemView;

const scene = starSystemView.scene;

const blackHoleModel = newSeededBlackHoleModel("blackHole", 42, "Gargantua", []);

const millerPlanetModel = newSeededTelluricPlanetModel("miller", 47, "Miller", [blackHoleModel]);
millerPlanetModel.orbit.semiMajorAxis = blackHoleModel.accretionDiskRadius * 10;
millerPlanetModel.orbit.inclination = 0.2;

const starSystemModel: StarSystemModel = {
    name: "Black Hole Demo",
    coordinates: {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    },
    stellarObjects: [blackHoleModel],
    planets: [millerPlanetModel],
    satellites: [],
    anomalies: [],
    orbitalFacilities: [],
};

engine.backend.universe.registerCustomSystem(starSystemModel);

const starSystem = await starSystemView.loadStarSystem(starSystemModel);

await engine.init(true);

await starSystemView.switchToDefaultControls(true);

const BH = starSystem.getStellarObjects()[0];

starSystemView.getDefaultControls().speed = BH.getBoundingRadius();

positionNearObjectBrightSide(scene.getActiveControls(), BH, starSystem, 5);
