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

import { ButterflyMaterial } from "../proceduralAssets/butterfly/butterflyMaterial";
import { GrassMaterial } from "../proceduralAssets/grass/grassMaterial";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class Materials {
    public static BUTTERFLY_MATERIAL: ButterflyMaterial;
    public static BUTTERFLY_DEPTH_MATERIAL: ButterflyMaterial;

    public static GRASS_MATERIAL: GrassMaterial;
    public static GRASS_DEPTH_MATERIAL: GrassMaterial;

    public static Init(scene: Scene) {
        Materials.BUTTERFLY_MATERIAL = new ButterflyMaterial(scene, false);
        Materials.BUTTERFLY_DEPTH_MATERIAL = new ButterflyMaterial(scene, true);

        Materials.GRASS_MATERIAL = new GrassMaterial(scene, false);
        Materials.GRASS_DEPTH_MATERIAL = new GrassMaterial(scene, true);
    }

    static DebugMaterial(name: string, diffuse: boolean, wireframe: boolean, scene: Scene) {
        const mat = new StandardMaterial(`${name}DebugMaterial`, scene);
        if (!diffuse) {
            mat.emissiveColor = Color3.Random();
            mat.disableLighting = true;
        } else mat.diffuseColor = Color3.Random();
        mat.wireframe = wireframe;
        return mat;
    }
}
