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

import { type Material } from "@babylonjs/core/Materials/material";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder, type Mesh } from "@babylonjs/core/Meshes";
import { type AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { MetalSectionMaterial } from "./metalSectionMaterial";

export class EngineBay implements Transformable {
    private readonly root: TransformNode;

    private readonly skirt: Mesh;
    private skirtAggregate: PhysicsAggregate | null = null;
    private readonly skirtMaterial: Material;

    private readonly engines: AbstractMesh[] = [];
    private readonly engineBodies: PhysicsBody[] = [];
    private readonly engineShape: PhysicsShape;

    private readonly scene: Scene;

    constructor(assets: RenderingAssets, scene: Scene) {
        this.root = new TransformNode("EngineBayRoot", scene);

        this.scene = scene;

        const nbEngines = 6;
        this.skirt = MeshBuilder.CreateCylinder(
            "EngineBaySkirt",
            {
                diameterTop: 100,
                height: 400,
                diameterBottom: 250,
                tessellation: nbEngines,
            },
            scene,
        );
        this.skirt.convertToFlatShadedMesh();

        this.skirtMaterial = new MetalSectionMaterial(
            "EngineBayMetalSectionMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        this.skirt.material = this.skirtMaterial;
        this.skirt.parent = this.root;

        const centerEngine = assets.objects.stationEngine.mesh.createInstance("Engine");
        this.engines.push(centerEngine);

        for (let i = 0; i < nbEngines; i++) {
            const engine = assets.objects.stationEngine.mesh.createInstance("Engine");
            engine.rotate(Axis.Y, ((Math.PI * 2) / nbEngines) * i, Space.LOCAL);
            engine.translate(Axis.X, 80, Space.LOCAL);
            this.engines.push(engine);
        }

        this.engines.forEach((engine) => {
            engine.parent = this.root;
            engine.translate(Axis.Y, -300, Space.LOCAL);
            engine.scaling.scaleInPlace(100);
        });

        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const center = boundingVectors.max.add(boundingVectors.min).scale(0.5);

        this.root.getChildTransformNodes(true).forEach((node) => {
            node.position.subtractInPlace(center);
        });

        this.engineShape = assets.objects.stationEngine.shape;
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());
        if (distanceToCamera < 350e3 && this.skirtAggregate === null) {
            this.skirtAggregate = createEnvironmentAggregate(this.skirt, PhysicsShapeType.MESH, this.scene);
            this.engines.forEach((engine) => {
                const engineBody = new PhysicsBody(engine, PhysicsMotionType.STATIC, false, this.scene);
                engineBody.setMassProperties({ mass: 0 });
                engineBody.shape = this.engineShape;
                engineBody.disablePreStep = false;
                this.engineBodies.push(engineBody);
            });
        } else if (distanceToCamera > 360e3 && this.skirtAggregate !== null) {
            this.skirtAggregate.dispose();
            this.skirtAggregate = null;

            this.engineBodies.forEach((body) => {
                body.dispose();
            });
            this.engineBodies.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.skirt.dispose();
        this.skirtMaterial.dispose();
        this.skirtAggregate?.dispose();
        this.engines.forEach((engine) => {
            engine.dispose();
        });
        this.engineBodies.forEach((body) => {
            body.dispose();
        });
    }
}
