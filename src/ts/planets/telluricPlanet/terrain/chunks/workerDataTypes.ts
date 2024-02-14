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

import { Direction } from "../../../../utils/direction";
import { TerrainSettings } from "../terrainSettings";
import { TaskType } from "./taskTypes";

export type WorkerData = {
    taskType: TaskType;
    planetName: string;
    planetDiameter: number;
    terrainSettings: TerrainSettings;
    position: number[];
    seed: number;
};

export type TransferBuildData = WorkerData & {
    nbVerticesPerSide: number;
    depth: number;
    direction: Direction;
};

export type TransferCollisionData = WorkerData;
