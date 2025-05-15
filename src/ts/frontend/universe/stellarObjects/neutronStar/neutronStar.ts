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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Scene } from "@babylonjs/core/scene";

import { NeutronStarModel } from "@/backend/universe/orbitalObjects/stellarObjects/neutronStarModel";

import { Cullable } from "@/utils/cullable";
import { isSizeOnScreenEnough } from "@/utils/isObjectVisibleOnScreen";
import { ItemPool } from "@/utils/itemPool";
import { getRgbFromTemperature } from "@/utils/specrend";
import { getOrbitalObjectTypeToI18nString } from "@/utils/strings/orbitalObjectTypeToDisplay";
import { DeepReadonly } from "@/utils/types";

import { OrbitalObjectType } from "../../architecture/orbitalObjectType";
import { StellarObjectBase } from "../../architecture/stellarObject";
import { defaultTargetInfoCelestialBody, TargetInfo } from "../../architecture/targetable";
import { TexturePools } from "../../assets/textures";
import { AsteroidField } from "../../asteroidFields/asteroidField";
import { VolumetricLightUniforms } from "../../postProcesses/volumetricLight/volumetricLightUniforms";
import { RingsLut } from "../../rings/ringsLut";
import { RingsUniforms } from "../../rings/ringsUniform";
import { Settings } from "../../settings";
import { StarMaterial } from "../star/starMaterial";

export class NeutronStar implements StellarObjectBase<OrbitalObjectType.NEUTRON_STAR>, Cullable {
    readonly model: DeepReadonly<NeutronStarModel>;

    readonly type = OrbitalObjectType.NEUTRON_STAR;

    readonly mesh: Mesh;
    readonly light: PointLight;

    private readonly material: StarMaterial;

    readonly aggregate: PhysicsAggregate;

    readonly volumetricLightUniforms = new VolumetricLightUniforms();

    readonly ringsUniforms: RingsUniforms | null;

    readonly asteroidField: AsteroidField | null;

    readonly targetInfo: TargetInfo;

    /**
     * New Star
     * @param model The seed of the star in [-1, 1]
     * @param scene
     */
    constructor(model: DeepReadonly<NeutronStarModel>, texturePools: TexturePools, scene: Scene) {
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
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2,
            },
            scene,
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.light = new PointLight(`${this.model.name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.model.blackBodyTemperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

        this.material = new StarMaterial(
            this.model.seed,
            this.model.blackBodyTemperature,
            texturePools.starMaterialLut,
            scene,
        );
        this.mesh.material = this.material;

        if (this.model.rings !== null) {
            this.ringsUniforms = new RingsUniforms(
                this.model.rings,
                Settings.RINGS_FADE_OUT_DISTANCE,
                texturePools.ringsLut,
                scene,
            );

            const averageRadius = (this.model.radius * (this.model.rings.ringStart + this.model.rings.ringEnd)) / 2;
            const spread = (this.model.radius * (this.model.rings.ringEnd - this.model.rings.ringStart)) / 2;
            this.asteroidField = new AsteroidField(
                this.model.rings.seed,
                this.getTransform(),
                averageRadius,
                spread,
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

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    getLight(): PointLight {
        return this.light;
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

    public dispose(ringsLutPool: ItemPool<RingsLut>): void {
        this.aggregate.dispose();
        this.mesh.dispose();
        this.light.dispose();
        this.material.dispose();
        this.asteroidField?.dispose();
        this.ringsUniforms?.dispose(ringsLutPool);
    }
}
