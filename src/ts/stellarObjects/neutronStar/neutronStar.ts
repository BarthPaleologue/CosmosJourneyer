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

import { Star } from "../star/star";
import { NeutronStarModel } from "./neutronStarModel";
import { UberScene } from "../../uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { CelestialBody } from "../../architecture/celestialBody";

export class NeutronStar extends Star {
    readonly descriptor: NeutronStarModel;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param model The seed of the star in [-1, 1]
     * @param parentBody
     */
    constructor(name: string, scene: UberScene, model: number | NeutronStarModel, parentBody: CelestialBody | null = null) {
        super(name, scene, model, parentBody);

        this.descriptor = model instanceof NeutronStarModel ? model : new NeutronStarModel(model, parentBody?.model);

        this.postProcesses.push(PostProcessType.MATTER_JETS);
    }

    getTypeName(): string {
        return "Neutron Star";
    }
}
