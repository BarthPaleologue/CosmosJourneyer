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

import type { Material } from "@babylonjs/core/Materials/material";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { type Scene } from "@babylonjs/core/scene";

import { ButterflyMaterial } from "./procedural/butterfly/butterflyMaterial";
import { GrassMaterial } from "./procedural/grass/grassMaterial";
import { SolarPanelMaterial } from "./procedural/solarPanel/solarPanelMaterial";
import { type Textures } from "./textures";

export type Materials = {
    readonly butterfly: ButterflyMaterial;
    readonly butterflyDepth: ButterflyMaterial;
    readonly grass: Material;
    readonly crate: PBRMetallicRoughnessMaterial;
    readonly solarPanel: SolarPanelMaterial;
    readonly tree: PBRMetallicRoughnessMaterial;
    readonly tank: PBRMetallicRoughnessMaterial;
};

export function initMaterials(textures: Textures, scene: Scene): Materials {
    const crateMaterial = new PBRMetallicRoughnessMaterial("crateMaterial", scene);
    crateMaterial.baseTexture = textures.materials.crate.albedo;
    crateMaterial.normalTexture = textures.materials.crate.normal;
    crateMaterial.metallicRoughnessTexture = textures.materials.crate.metallicRoughness;

    const treeMaterial = new PBRMetallicRoughnessMaterial("treeMaterial", scene);
    treeMaterial.backFaceCulling = false;
    treeMaterial.baseTexture = textures.materials.tree.albedo;
    treeMaterial.transparencyMode = 1;

    const tankMaterial = new PBRMetallicRoughnessMaterial("tankMaterial", scene);
    tankMaterial.baseColor.copyFromFloats(0.2, 0.2, 0.2);
    tankMaterial.metallic = 1;
    tankMaterial.roughness = 0.4;

    return {
        butterfly: new ButterflyMaterial(textures.particles.butterfly, scene, false),
        butterflyDepth: new ButterflyMaterial(textures.particles.butterfly, scene, true),
        grass: new GrassMaterial(textures.noises.seamlessPerlin, scene).get(),
        crate: crateMaterial,
        solarPanel: new SolarPanelMaterial(textures.materials.solarPanel, scene),
        tree: treeMaterial,
        tank: tankMaterial,
    };
}

export function createDebugMaterial(name: string, diffuse: boolean, wireframe: boolean, scene: Scene) {
    const mat = new StandardMaterial(`${name}DebugMaterial`, scene);
    if (!diffuse) {
        mat.emissiveColor = Color3.Random();
        mat.disableLighting = true;
    } else mat.diffuseColor = Color3.Random();
    mat.wireframe = wireframe;
    return mat;
}
