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
import { type Material } from "@babylonjs/core/Materials/material";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { type GasPlanetModel } from "@/backend/universe/orbitalObjects/gasPlanetModel";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { type Textures } from "@/frontend/assets/textures";
import { type Cullable } from "@/frontend/helpers/cullable";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { type RingsProceduralPatternLut } from "@/frontend/postProcesses/rings/ringsProceduralLut";
import { RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { type PlanetaryMassObjectBase } from "@/frontend/universe/architecture/planetaryMassObject";
import { defaultTargetInfoCelestialBody, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";

import { isSizeOnScreenEnough } from "@/utils/isObjectVisibleOnScreen";
import { type ItemPool } from "@/utils/itemPool";
import { getOrbitalObjectTypeToI18nString } from "@/utils/strings/orbitalObjectTypeToDisplay";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { GasPlanetProceduralMaterial } from "./gasPlanetProceduralMaterial";
import { createGasPlanetTextureMaterial } from "./gasPlanetTextureMaterial";

export class GasPlanet implements PlanetaryMassObjectBase<OrbitalObjectType.GAS_PLANET>, Cullable {
    readonly model: DeepReadonly<GasPlanetModel>;

    readonly type = OrbitalObjectType.GAS_PLANET;

    private readonly mesh: Mesh;
    readonly material: GasPlanetProceduralMaterial | Material;

    readonly aggregate: PhysicsAggregate;

    readonly atmosphereUniforms: AtmosphereUniforms;

    readonly ringsUniforms: RingsUniforms | null;
    readonly asteroidField: AsteroidField | null;

    readonly targetInfo: TargetInfo;

    /**
     * New Gas Planet
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     * @param scene
     */
    constructor(
        model: DeepReadonly<GasPlanetModel>,
        textures: Textures,
        ringsLutPool: ItemPool<RingsProceduralPatternLut>,
        scene: Scene,
    ) {
        this.model = model;

        this.mesh = MeshBuilder.CreateSphere(
            this.model.name,
            {
                diameter: this.model.radius * 2,
                segments: 64,
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

        if (this.model.colorPalette.type === "procedural") {
            this.material = new GasPlanetProceduralMaterial(
                this.model.name,
                this.model.seed,
                this.model.colorPalette,
                scene,
            );
        } else {
            this.material = createGasPlanetTextureMaterial(
                this.model.colorPalette.textureId,
                textures.gasPlanet,
                scene,
            );
        }

        this.mesh.material = this.material;

        const atmosphereThickness =
            Settings.EARTH_ATMOSPHERE_THICKNESS * Math.max(1, this.model.radius / Settings.EARTH_RADIUS);
        this.atmosphereUniforms = new AtmosphereUniforms(this.getBoundingRadius(), atmosphereThickness);

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

    updateMaterial(stellarObjects: ReadonlyArray<PointLight>, deltaSeconds: number): void {
        if (this.material instanceof GasPlanetProceduralMaterial) {
            this.material.update(stellarObjects, deltaSeconds);
        }
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.model.radius;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    public computeCulling(camera: Camera): void {
        // the mesh is hidden if it is not visible from any camera
        this.mesh.isVisible = isSizeOnScreenEnough(this, camera);
    }

    public dispose(ringsLutPool: ItemPool<RingsProceduralPatternLut>): void {
        this.mesh.dispose();
        this.aggregate.dispose();
        this.material.dispose();
        this.asteroidField?.dispose();
        this.ringsUniforms?.dispose(ringsLutPool);
    }

    getTransform(): TransformNode {
        return this.mesh;
    }
}
