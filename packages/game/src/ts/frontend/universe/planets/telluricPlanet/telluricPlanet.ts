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
import { type PointLight } from "@babylonjs/core/Lights/pointLight";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { type Cullable } from "@/frontend/helpers/cullable";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { type CloudsLut } from "@/frontend/postProcesses/clouds/cloudsLut";
import { CloudsUniforms } from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { OceanUniforms } from "@/frontend/postProcesses/ocean/oceanUniforms";
import { type RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { type PlanetaryMassObjectBase } from "@/frontend/universe/architecture/planetaryMassObject";
import { defaultTargetInfoCelestialBody, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";

import { type ItemPool } from "@/utils/itemPool";
import { type DeepReadonly } from "@/utils/types";

import { CollisionMask, Settings } from "@/settings";

import { TelluricPlanetMaterial } from "./telluricPlanetMaterial";
import { type ChunkForge } from "./terrain/chunks/chunkForge";
import { ChunkTree } from "./terrain/chunks/chunkTree";

export class TelluricPlanet implements PlanetaryMassObjectBase<"telluricPlanet" | "telluricSatellite">, Cullable {
    readonly model: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;

    readonly type: "telluricPlanet" | "telluricSatellite";

    readonly sides: ChunkTree[]; // stores the 6 sides of the sphere

    readonly material: TelluricPlanetMaterial;

    private readonly transform: TransformNode;
    readonly aggregate: PhysicsAggregate;

    readonly atmosphereUniforms: AtmosphereUniforms | null;

    readonly oceanUniforms: OceanUniforms | null;

    readonly ringsUniforms: RingsUniforms | null;
    readonly asteroidField: AsteroidField | null;

    readonly cloudsUniforms: CloudsUniforms | null;

    readonly targetInfo: TargetInfo;

    /**
     * New Telluric Planet
     * @param model The model to build the planet or a seed for the planet in [-1, 1]
     * @param scene
     */
    constructor(
        model: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        assets: RenderingAssets,
        scene: Scene,
    ) {
        this.model = model;

        this.type = model.type;

        this.transform = new TransformNode(this.model.name, scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.getBoundingRadius(), scene);
        physicsShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        physicsShape.filterCollideMask = CollisionMask.SURFACE_QUERY | CollisionMask.SUN_OCCLUSION_QUERY;
        if (model.ocean !== null) {
            physicsShape.filterMembershipMask |= CollisionMask.WATER;
        }

        this.aggregate = new PhysicsAggregate(this.getTransform(), physicsShape, undefined, scene);
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;

        if (this.model.atmosphere !== null) {
            const atmosphereThickness =
                Settings.EARTH_ATMOSPHERE_THICKNESS * Math.max(1, this.model.radius / Settings.EARTH_RADIUS);
            this.atmosphereUniforms = new AtmosphereUniforms(this.getBoundingRadius(), atmosphereThickness);
        } else {
            this.atmosphereUniforms = null;
        }

        if (this.model.ocean !== null) {
            this.oceanUniforms = new OceanUniforms(this.getRadius(), this.model.ocean.depth);
        } else {
            this.oceanUniforms = null;
        }

        if (this.model.type === "telluricPlanet" && this.model.rings !== null) {
            this.ringsUniforms = RingsUniforms.New(
                this.model.rings,
                assets.textures,
                Settings.RINGS_FADE_OUT_DISTANCE,
                scene,
            );

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

        if (this.model.clouds !== null) {
            this.cloudsUniforms = new CloudsUniforms(this.model.clouds, assets.textures.pools.cloudsLut, scene);
        } else {
            this.cloudsUniforms = null;
        }

        this.material = new TelluricPlanetMaterial(
            this.model,
            assets.textures.terrains,
            assets.textures.pools.telluricPlanetMaterialLut,
            scene,
        );

        this.sides = [
            new ChunkTree("up", this.model, this.aggregate, this.material, scene),
            new ChunkTree("down", this.model, this.aggregate, this.material, scene),
            new ChunkTree("forward", this.model, this.aggregate, this.material, scene),
            new ChunkTree("backward", this.model, this.aggregate, this.material, scene),
            new ChunkTree("right", this.model, this.aggregate, this.material, scene),
            new ChunkTree("left", this.model, this.aggregate, this.material, scene),
        ];

        this.targetInfo = defaultTargetInfoCelestialBody(this.getBoundingRadius());
        this.targetInfo.maxDistance =
            this.model.type === "telluricSatellite" ? this.model.orbit.semiMajorAxis * 8.0 : 0;
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getCloudsUniforms(): CloudsUniforms | null {
        return this.cloudsUniforms;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     * @param chunkForge
     */
    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge): void {
        for (const side of this.sides) side.update(observerPosition, chunkForge);
    }

    public updateMaterial(stellarObjects: ReadonlyArray<PointLight>): void {
        this.material.update(this.getTransform().getWorldMatrix(), stellarObjects);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius() + (this.model.ocean?.depth ?? 0);
    }

    public computeCulling(camera: Camera): void {
        for (const side of this.sides) side.computeCulling(camera);
    }

    public dispose(ringsLutPool: ItemPool<RingsProceduralPatternLut>, cloudsLutPool: ItemPool<CloudsLut>): void {
        this.sides.forEach((side) => {
            side.dispose();
        });
        this.sides.length = 0;

        this.cloudsUniforms?.dispose(cloudsLutPool);
        this.ringsUniforms?.dispose(ringsLutPool);

        this.material.dispose();
        this.aggregate.dispose();
        this.transform.dispose();
        this.asteroidField?.dispose();
    }
}
