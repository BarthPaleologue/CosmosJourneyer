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

import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Scene } from "@babylonjs/core/scene";

import { OrbitalFacilityModel } from "@/backend/universe/orbitalObjects/index";

import { RenderingAssets } from "@/frontend/assets/renderingAssets";
import { LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { createRing } from "@/utils/geometry/ringBuilder";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { createEnvironmentAggregate } from "@/utils/havok";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";
import { DeepReadonly } from "@/utils/types";

import { LandingPad } from "../landingPad/landingPad";
import { MetalSectionMaterial } from "../metalSectionMaterial";
import { LandingBayMaterial } from "./landingBayMaterial";

export class LandingBay {
    private readonly root: TransformNode;

    readonly rng: (step: number) => number;

    private readonly radius: number;

    private readonly landingBayMaterial: LandingBayMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly ring: Mesh;
    private ringAggregate: PhysicsAggregate | null = null;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    private readonly centralLight: PointLight;

    readonly landingPads: LandingPad[] = [];

    constructor(stationModel: DeepReadonly<OrbitalFacilityModel>, seed: number, assets: RenderingAssets, scene: Scene) {
        this.root = new TransformNode("LandingBayRoot", scene);

        this.centralLight = new PointLight("LandingBayCentralLight", Vector3.Zero(), scene);
        this.centralLight.parent = this.root;
        this.centralLight.intensity = 1000;

        this.rng = getRngFromSeed(seed);

        this.radius = 500;

        const deltaRadius = this.radius / 3;

        this.metalSectionMaterial = new MetalSectionMaterial(
            "LandingBayMetalSectionMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        const heightFactor = 2 + Math.floor(this.rng(0) * 3);

        const circumference = 2 * Math.PI * this.radius;

        let nbSteps = Math.ceil(circumference / deltaRadius);
        if (nbSteps % 2 !== 0) {
            nbSteps += 1;
        }

        this.ring = createRing(this.radius, deltaRadius, heightFactor * deltaRadius, nbSteps, scene);

        this.landingBayMaterial = new LandingBayMaterial(
            stationModel,
            this.radius,
            deltaRadius,
            heightFactor,
            assets.textures.materials.spaceStation,
            scene,
        );
        this.ring.material = this.landingBayMaterial;

        this.ring.parent = this.getTransform();

        this.ringAggregate = createEnvironmentAggregate(this.ring, PhysicsShapeType.MESH, scene);

        const yExtent = this.ring.getBoundingInfo().boundingBox.extendSize.y;

        const nbArms = 6;
        const armDiameter = deltaRadius / 4;
        const armHeight = this.radius * 1.618;
        const armRotation = 2 * Math.asin((0.5 * this.radius) / armHeight);
        const armOffset = Math.sqrt(armHeight * armHeight - this.radius * this.radius);
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
                {
                    height: armHeight,
                    diameter: armDiameter,
                    tessellation: 4,
                },
                scene,
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, armRotation, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const theta = (i / nbArms) * Math.PI * 2;

            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.translate(Axis.Y, -armOffset - yExtent, Space.WORLD);
            arm.translate(Axis.Y, armHeight / 2, Space.LOCAL);

            arm.parent = this.getTransform();

            this.arms.push(arm);

            const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.BOX, scene);
            this.armAggregates.push(armAggregate);
        }

        const nbPads = nbSteps;
        let padNumber = 0;
        for (let row = 0; row < heightFactor; row++) {
            for (let i = 0; i < nbPads; i++) {
                const landingPad = new LandingPad(
                    padNumber++,
                    (i + row) % 2 === 0 ? LandingPadSize.SMALL : LandingPadSize.MEDIUM,
                    assets,
                    scene,
                );
                landingPad.getTransform().parent = this.getTransform();

                landingPad.getTransform().rotate(Axis.Z, Math.PI / 2, Space.LOCAL);

                landingPad.getTransform().rotate(Axis.X, ((i + 0.5) * 2.0 * Math.PI) / nbPads, Space.LOCAL);

                landingPad.getTransform().rotate(Axis.Y, Math.PI / 2, Space.LOCAL);

                landingPad
                    .getTransform()
                    .translate(
                        Vector3.Up(),
                        -(this.radius - deltaRadius / 2) * Math.cos(Math.PI / nbPads),
                        Space.LOCAL,
                    );

                landingPad
                    .getTransform()
                    .translate(
                        Vector3.Forward(scene.useRightHandedSystem),
                        row * deltaRadius - ((heightFactor - 1) * deltaRadius) / 2,
                        Space.LOCAL,
                    );

                this.landingPads.push(landingPad);
            }
        }

        this.getTransform().computeWorldMatrix(true);

        const bb = this.getTransform().getHierarchyBoundingVectors();
        const extend = bb.max.subtract(bb.min);
        const center = bb.min.add(extend.scale(0.5));

        this.getTransform()
            .getChildMeshes(true)
            .forEach((mesh) => {
                mesh.position.subtractInPlace(center);
            });

        this.centralLight.includedOnlyMeshes = this.getTransform().getChildMeshes();
    }

    update(cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.getTransform().rotate(
            Axis.Y,
            deltaSeconds / getRotationPeriodForArtificialGravity(this.radius, EarthG * 0.1),
        );

        this.landingPads.forEach((landingPad) => {
            const padCameraDistance2 = Vector3.DistanceSquared(
                cameraWorldPosition,
                landingPad.getTransform().getAbsolutePosition(),
            );
            const distanceThreshold = 12e3;
            const isEnabled = padCameraDistance2 < distanceThreshold * distanceThreshold;
            landingPad.getTransform().setEnabled(isEnabled);
        });

        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.ringAggregate === null) {
            this.ringAggregate = createEnvironmentAggregate(
                this.ring,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
            this.arms.forEach((arm) => {
                const armAggregate = createEnvironmentAggregate(
                    arm,
                    PhysicsShapeType.BOX,
                    this.getTransform().getScene(),
                );
                this.armAggregates.push(armAggregate);
            });
        } else if (distanceToCamera > 360e3 && this.ringAggregate !== null) {
            this.ringAggregate.dispose();
            this.ringAggregate = null;

            this.armAggregates.forEach((armAggregate) => {
                armAggregate.dispose();
            });
            this.armAggregates.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.ring.dispose();

        this.ringAggregate?.dispose();
        this.ringAggregate = null;

        this.landingBayMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.arms.forEach((arm) => {
            arm.dispose();
        });

        this.armAggregates.forEach((armAggregate) => {
            armAggregate.dispose();
        });
        this.armAggregates.length = 0;

        this.landingPads.forEach((landingPad) => {
            landingPad.dispose();
        });

        this.centralLight.dispose();
    }
}
