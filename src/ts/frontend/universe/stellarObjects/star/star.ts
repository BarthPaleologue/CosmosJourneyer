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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type StarModel } from "@/backend/universe/orbitalObjects/stellarObjects/starModel";

import { type Textures } from "@/frontend/assets/textures";
import { type Cullable } from "@/frontend/helpers/cullable";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { type RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { VolumetricLightUniforms } from "@/frontend/postProcesses/volumetricLight/volumetricLightUniforms";
import { type StellarObjectBase } from "@/frontend/universe/architecture/stellarObject";
import { defaultTargetInfoCelestialBody, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";

import { type ItemPool } from "@/utils/itemPool";
import { getRgbFromTemperature } from "@/utils/specrend";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { StarMaterial } from "./starMaterial";

export class Star implements StellarObjectBase<OrbitalObjectType.STAR>, Cullable {
    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    readonly aggregate: PhysicsAggregate;

    readonly volumetricLightUniforms = new VolumetricLightUniforms();

    readonly ringsUniforms: RingsUniforms | null;

    readonly asteroidField: AsteroidField | null;

    readonly model: DeepReadonly<StarModel>;

    readonly type = OrbitalObjectType.STAR;

    readonly targetInfo: TargetInfo;

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

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.SPHERE,
            {
                mass: 0,
                restitution: 0.2,
            },
            scene,
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;

        this.light = new PointLight(`${this.model.name}Light`, Vector3.Zero(), scene);
        const starColor = getRgbFromTemperature(this.model.blackBodyTemperature);
        this.light.diffuse.copyFromFloats(starColor.r, starColor.g, starColor.b);
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

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

        this.targetInfo = defaultTargetInfoCelestialBody(this.getBoundingRadius());
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    getLight(): PointLight {
        return this.light;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
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
        this.aggregate.dispose();
        this.material.dispose();
        this.light.dispose();
        this.asteroidField?.dispose();
        this.ringsUniforms?.dispose(ringsLutPool);
        this.mesh.dispose();
    }
}
