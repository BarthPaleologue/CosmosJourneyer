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

import { NeutronStarModel } from "./neutronStarModel";
import { UberScene } from "../../uberCore/uberScene";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { CelestialBody } from "../../architecture/celestialBody";
import { StellarObject } from "../../architecture/stellarObject";
import { Cullable } from "../../bodies/cullable";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StarMaterial } from "../star/starMaterial";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { OrbitalObject } from "../../architecture/orbitalObject";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { getRgbFromTemperature } from "../../utils/specrend";
import { Light } from "@babylonjs/core/Lights/light";
import { setRotationQuaternion } from "../../uberCore/transforms/basicTransform";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import { RingsUniforms } from "../../rings/ringsUniform";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";
import i18n from "../../i18n";

export class NeutronStar implements StellarObject, Cullable {
    readonly model: NeutronStarModel;

    readonly name: string;

    readonly mesh: Mesh;
    readonly light: PointLight;

    private readonly material: StarMaterial;

    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly ringsUniforms: RingsUniforms | null;

    readonly parent: OrbitalObject | null;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param model The seed of the star in [-1, 1]
     * @param parentBody
     */
    constructor(name: string, scene: UberScene, model: number | NeutronStarModel, parentBody: CelestialBody | null = null) {
        this.model = model instanceof NeutronStarModel ? model : new NeutronStarModel(model, parentBody?.model);
        this.name = name;

        this.parent = parentBody;

        this.mesh = MeshBuilder.CreateSphere(
            name,
            {
                diameter: this.model.radius * 2,
                segments: 32
            },
            scene
        );

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
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

        this.material = new StarMaterial(this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.postProcesses.push(PostProcessType.VOLUMETRIC_LIGHT, PostProcessType.LENS_FLARE, PostProcessType.MATTER_JETS);
        if (this.model.rings !== null) {
            this.postProcesses.push(PostProcessType.RING);

            this.ringsUniforms = new RingsUniforms(this.model.rings, scene);
        } else {
            this.ringsUniforms = null;
        }
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:neutronStar");
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

    public dispose(): void {
        this.mesh.dispose();
        this.light.dispose();
        this.material.dispose();
    }
}
