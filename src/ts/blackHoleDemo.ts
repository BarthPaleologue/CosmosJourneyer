//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "../styles/index.scss";

import { StarSystemController } from "./starSystem/starSystemController";

import { positionNearObjectBrightSide } from "./utils/positionNearObject";
import { CosmosJourneyer } from "./cosmosJourneyer";
import { StarSystemHelper } from "./starSystem/starSystemHelper";
import { SystemSeed } from "./utils/systemSeed";

const engine = await CosmosJourneyer.CreateAsync();

const starSystemView = engine.starSystemView;

const scene = starSystemView.scene;

const starSystemSeed = new SystemSeed(0, 0, 0, 0);
const starSystem = new StarSystemController(starSystemSeed, scene);

const BH = StarSystemHelper.MakeBlackHole(starSystem, 0);
BH.model.orbit.radius = 0;
BH.model.physicalProperties.accretionDiskRadius = BH.model.radius * 12;

const planet = StarSystemHelper.MakeTelluricPlanet(starSystem);
planet.model.orbit.radius = 45 * planet.getRadius();
planet.model.orbit.period = 24 * 60 * 60;

await starSystemView.loadStarSystem(starSystem, false);

engine.init(true);

starSystemView.switchToDefaultControls();

positionNearObjectBrightSide(scene.getActiveControls(), BH, starSystem, 20);
