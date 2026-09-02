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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { StarModel } from "@cosmos-journeyer/universe-model";

import type { Cullable } from "@/frontend/helpers/cullable";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import type { Textures } from "@/frontend/presentation/assets/textures";
import type { RingsProceduralPatternLut } from "@/frontend/presentation/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/presentation/postProcesses/rings/ringsUniform";
import { VolumetricLightUniforms } from "@/frontend/presentation/postProcesses/volumetricLight/volumetricLightUniforms";
import { AsteroidField } from "@/frontend/simulation/asteroidFields/asteroidField";

import type { ItemPool } from "@/utils/itemPool";
import { getRgbFromTemperature } from "@/utils/specrend";

import { Settings } from "@/settings";

import type { CelestialBodyBase } from "../../architecture/celestialBody";
import { StarMaterial } from "./starMaterial";

export class Star implements CelestialBodyBase<"star">, Cullable {
    readonly mesh: Mesh;

    private readonly material: StarMaterial;

    private readonly emissiveColor: Color3;

    readonly volumetricLightUniforms = new VolumetricLightUniforms();

    readonly ringsUniforms: RingsUniforms | null;

    readonly asteroidField: AsteroidField | null;

    readonly model: DeepReadonly<StarModel>;

    readonly type = "star";

    /**
     * New Star
     * @param model The seed of the star in [-1, 1]
     * @param scene
     */
    constructor(model: DeepReadonly<StarModel>, textures: Textures, scene: Scene) {
        this.model = model;

        this.mesh = MeshBuilder.CreateSphere(
            this.model.name,
            {
                diameter: this.model.radius * 2,
                segments: 32,
            },
            scene,
        );
        this.mesh.rotationQuaternion = Quaternion.Identity();

        const starColor = getRgbFromTemperature(this.model.blackBodyTemperature);
        this.emissiveColor = new Color3(starColor.r, starColor.g, starColor.b);

        this.material = new StarMaterial(
            this.model.seed,
            this.model.blackBodyTemperature,
            textures.pools.starMaterialLut,
            scene,
        );
        this.mesh.material = this.material;

        if (this.model.rings !== null) {
            this.ringsUniforms = RingsUniforms.New(this.model.rings, textures, Settings.RINGS_FADE_OUT_DISTANCE, scene);

            this.asteroidField = new AsteroidField(
                this.model.seed,
                this.getTransform(),
                this.model.rings.innerRadius,
                this.model.rings.outerRadius,
                scene,
            );
        } else {
            this.ringsUniforms = null;
            this.asteroidField = null;
        }
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    getEmissiveColor(): Color3 {
        return this.emissiveColor;
    }

    public updateMaterial(deltaTime: number): void {
        this.material.update(deltaTime);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius();
    }

    public computeCulling(camera: Camera): void {
        this.mesh.isVisible = isSizeOnScreenEnough(this, camera);
    }

    public dispose(ringsLutPool: ItemPool<RingsProceduralPatternLut>): void {
        this.material.dispose();
        this.asteroidField?.dispose();
        this.ringsUniforms?.dispose(ringsLutPool);
        this.mesh.dispose();
    }
}
