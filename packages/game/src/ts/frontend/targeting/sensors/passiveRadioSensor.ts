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

import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Target } from "../target";
import type { Sensor } from "./sensor";

export class PassiveRadioSensor implements Sensor {
    private readonly transform: TransformNode;

    constructor(name: string, scene: Scene) {
        this.transform = new TransformNode(name, scene);
    }

    detects(target: Target) {
        switch (target.type) {
            case "anomaly":
            case "blackHole":
            case "custom":
            case "gasPlanet":
            case "landingBay":
            case "landingPad":
            case "neutronStar":
            case "spaceElevator":
            case "spaceElevatorClimber":
            case "spaceStation":
            case "spaceship":
            case "star":
            case "starSystem":
            case "telluricPlanet":
            case "telluricSatellite":
            case "vehicle":
                return false;
        }
    }

    getTransform() {
        return this.transform;
    }
}
