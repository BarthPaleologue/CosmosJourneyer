//  This file is part of CosmosJourneyer
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
import { BODY_TYPE } from "./model/common";
import { SystemSeed } from "./utils/systemSeed";

const engine = new CosmosJourneyer();

await engine.setup();

const starSystemView = engine.getStarSystemView();

const scene = starSystemView.scene;

const starMapX = Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapY = Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const starMapZ = Math.trunc((Math.random() * 2 - 1) * Number.MAX_SAFE_INTEGER * 0.1);
const index = 0;

const seed = new SystemSeed(starMapX, starMapY, starMapZ, index);

const starSystem = new StarSystemController(seed, scene);
starSystemView.setStarSystem(starSystem, true);

engine.getStarMap().setCurrentStarSystem(seed);

engine.init(true);

const planetIndex = 0;

const nbRadius = starSystem.model.getBodyTypeOfStar(0) === BODY_TYPE.BLACK_HOLE ? 8 : 3;
if (planetIndex >= starSystem.planets.length) throw new Error(`Planet index (${planetIndex}) out of bound (0 - ${starSystem.planets.length - 1})!`);
const planet = starSystem.planets.length > 0 ? starSystem.planets[0] : starSystem.stellarObjects[0];
positionNearObjectBrightSide(scene.getActiveController(), planet, starSystem, nbRadius);

starSystemView.ui.setEnabled(true);
starSystemView.showUI();
