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

import { Effect } from "@babylonjs/core/Materials/effect";
import lutFragment from "../../../shaders/telluricPlanetMaterial/utils/lut.glsl";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "@babylonjs/core/scene";
import { TelluricPlanetaryMassObjectPhysicsInfo } from "../../architecture/physicsInfo";

export class TelluricPlanetMaterialLut {
    private readonly lut: ProceduralTexture;

    constructor(scene: Scene) {
        if (Effect.ShadersStore["telluricPlanetLutFragmentShader"] === undefined) {
            Effect.ShadersStore["telluricPlanetLutFragmentShader"] = lutFragment;
        }

        this.lut = new ProceduralTexture(
            `TelluricPlanetMaterialLut`,
            4096,
            "telluricPlanetLut",
            scene,
            null,
            true,
            false
        );
    }

    setPlanetPhysicsInfo(physics: TelluricPlanetaryMassObjectPhysicsInfo) {
        this.lut.setFloat("minTemperature", physics.minTemperature);
        this.lut.setFloat("maxTemperature", physics.maxTemperature);
        this.lut.setFloat("pressure", physics.pressure);
        this.lut.refreshRate = 1;
        this.lut.onGeneratedObservable.addOnce(() => {
            this.lut.refreshRate = 0;
        });
    }

    getTexture(): ProceduralTexture {
        return this.lut;
    }

    dispose() {
        this.lut.dispose();
    }
}
