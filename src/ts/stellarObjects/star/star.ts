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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StarMaterial } from "./starMaterial";
import { StarModel } from "./starModel";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Light } from "@babylonjs/core/Lights/light";
import { setRotationQuaternion } from "../../uberCore/transforms/basicTransform";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { getStellarTypeString } from "../common";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";
import { CelestialBody } from "../../architecture/celestialBody";
import { OrbitalObject } from "../../architecture/orbitalObject";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { StellarObject } from "../../architecture/stellarObject";
import { Cullable } from "../../utils/cullable";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { RingsUniforms } from "../../rings/ringsUniform";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import i18n from "../../i18n";
import { Scene } from "@babylonjs/core/scene";
import { Objects } from "../../assets/objects";
import { AsteroidField } from "../../asteroidFields/asteroidField";

export class Star implements StellarObject, Cullable {
    readonly name: string;

    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly ringsUniforms: RingsUniforms | null;

    private readonly asteroidField: AsteroidField | null;

    readonly model: StarModel;

    readonly parent: OrbitalObject | null;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param parentBody The bodies the star is orbiting
     * @param model The seed of the star in [-1, 1]
     */
    constructor(name: string, scene: Scene, model: StarModel | number, parentBody: CelestialBody | null = null) {
        this.name = name;

        this.parent = parentBody;

        this.model = model instanceof StarModel ? model : new StarModel(model, parentBody?.model);

        const isSphere = this.model.rng(42) > 0.1;

        this.mesh = isSphere
            ? MeshBuilder.CreateSphere(
                  name,
                  {
                      diameter: this.model.radius * 2,
                      segments: 32
                  },
                  scene
              )
            : Objects.CreateBananaClone(2 * this.model.radius);
        this.mesh.name = name; // enforce name in the case of cloning the banana

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;
        //FIXME: the radius here is a dirty fix because bakeTransformIntoVertexData does not work for reasons unknown
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), isSphere ? this.model.radius : 0.1, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.copyFrom(this.model.color);
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

        this.material = new StarMaterial(this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.postProcesses.push(PostProcessType.VOLUMETRIC_LIGHT, PostProcessType.LENS_FLARE);
        if (this.model.rings !== null) {
            this.postProcesses.push(PostProcessType.RING);

            this.ringsUniforms = new RingsUniforms(this.model.rings, scene);
            
            const averageRadius = this.model.radius * (this.model.rings.ringStart + this.model.rings.ringEnd) / 2;
            const spread = this.model.radius * (this.model.rings.ringEnd - this.model.rings.ringStart) / 2;
            this.asteroidField = new AsteroidField(this.model.rng(84133), this.getTransform(), averageRadius, spread, scene);
        } else {
            this.ringsUniforms = null;
            this.asteroidField = null;
        }
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getLight(): PointLight {
        return this.light;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    getRingsUniforms(): RingsUniforms | null {
        return this.ringsUniforms;
    }

    getAsteroidField(): AsteroidField | null {
        return this.asteroidField;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:star", { stellarType: getStellarTypeString(this.model.stellarType) });
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

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }
        this.mesh.isVisible = isVisible;
    }

    public dispose(): void {
        this.mesh.dispose();
        this.material.dispose();
        this.light.dispose();
        this.asteroidField?.dispose();
    }
}
