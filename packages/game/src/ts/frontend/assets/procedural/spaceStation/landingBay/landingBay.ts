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

import type { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { type OrbitalFacilityModel } from "@/backend/universe/orbitalObjects/index";

import { createRing } from "@/frontend/assets/procedural/helpers/ringBuilder";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { createCircleInstanceBuffer } from "@/frontend/helpers/instancing";
import { LandingPadSize, LandingPadStatus } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { EarthG } from "@/utils/physics/constants";
import { getRotationPeriodForArtificialGravity } from "@/utils/physics/physics";
import { degreesToRadians } from "@/utils/physics/unitConversions";
import { type DeepReadonly } from "@/utils/types";

import { ProceduralSpotLightInstances, type ProceduralSpotLightInstanceData } from "../../spotLight";
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

    readonly landingPads: LandingPad[] = [];

    private readonly landingPadLights: ProceduralSpotLightInstances;

    private readonly lights: Array<Light> = [];

    constructor(stationModel: DeepReadonly<OrbitalFacilityModel>, seed: number, assets: RenderingAssets, scene: Scene) {
        this.root = new TransformNode("LandingBayRoot", scene);

        this.rng = getRngFromSeed(seed);

        this.radius = 500;

        const deltaRadius = this.radius / 3;

        this.metalSectionMaterial = new MetalSectionMaterial(
            "LandingBayMetalSectionMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );

        const heightFactor = 1 + Math.floor(this.rng(0) * 3);

        const circumference = 2 * Math.PI * this.radius;

        let nbSteps = Math.ceil(circumference / deltaRadius);
        if (nbSteps % 2 !== 0) {
            nbSteps += 1;
        }

        this.ring = createRing(this.radius, deltaRadius, heightFactor * deltaRadius, nbSteps, scene);

        const lightMeshMaterial = new StandardMaterial("LandingBayLightMeshMaterial", scene);
        lightMeshMaterial.emissiveColor.set(1, 1, 1);
        lightMeshMaterial.disableLighting = true;

        const lampHeight = deltaRadius / 16;
        const lampThickness = lampHeight;
        const lightMeshInstances = MeshBuilder.CreateBox(
            `LandingBayLightCaps`,
            {
                width: deltaRadius / 8,
                depth: lampThickness,
                height: lampHeight,
            },
            scene,
        );
        lightMeshInstances.material = lightMeshMaterial;
        lightMeshInstances.parent = this.getTransform();

        const lampPostHeight = 10;
        lightMeshInstances.position.y = (heightFactor * deltaRadius) / 2 + lampPostHeight + lampHeight / 2;

        const lightMatrixBuffer = createCircleInstanceBuffer(this.radius + (deltaRadius - lampThickness) / 2, nbSteps);
        lightMeshInstances.thinInstanceSetBuffer("matrix", lightMatrixBuffer, 16);

        const lampPostInstances = MeshBuilder.CreateCylinder(
            `LandingBayLightPosts`,
            {
                height: lampPostHeight,
                diameter: lampThickness * 0.618,
                tessellation: 6,
                updatable: false,
            },
            scene,
        );
        lampPostInstances.convertToFlatShadedMesh();
        const lampPostMaterial = new PBRMaterial("lampPostMaterial", scene);
        lampPostMaterial.metallic = 1;
        lampPostMaterial.roughness = 0.4;
        lampPostMaterial.useGLTFLightFalloff = true;
        lampPostInstances.material = lampPostMaterial;
        lampPostInstances.parent = this.getTransform();
        lampPostInstances.position.y = (heightFactor * deltaRadius) / 2 + lampPostHeight / 2;

        lampPostInstances.thinInstanceSetBuffer("matrix", lightMatrixBuffer, 16);

        for (let i = 0; i < nbSteps; i++) {
            const bufferOffset = i * 16;
            const x = lightMatrixBuffer[bufferOffset + 12];
            const y = lightMatrixBuffer[bufferOffset + 13];
            const z = lightMatrixBuffer[bufferOffset + 14];

            const light = new PointLight(`LandingBayLightCaps${i}`, new Vector3(x, y, z), scene, true);
            light.range = deltaRadius * 2;
            light.parent = lightMeshInstances;

            this.lights.push(light);
        }

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
                `LandingBayArm${i}`,
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
        const lightInstanceData: Array<ProceduralSpotLightInstanceData> = [];
        for (let row = 0; row < heightFactor; row++) {
            for (let i = 0; i < nbPads; i++) {
                const landingPad = new LandingPad(
                    padNumber++,
                    (i + row) % 2 === 0 ? LandingPadSize.SMALL : LandingPadSize.MEDIUM,
                    assets.textures,
                    scene,
                );
                landingPad.getTransform().parent = this.getTransform();

                landingPad.getTransform().rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
                landingPad.getTransform().rotate(Axis.X, ((i + 0.5) * 2.0 * Math.PI) / nbPads, Space.LOCAL);
                landingPad.getTransform().rotate(Axis.Y, -Math.PI / 2, Space.LOCAL);

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

                const landingPadCenter = landingPad.getTransform().position;
                const landingPadUp = landingPad.getTransform().up;
                for (const corner of landingPad.getCorners()) {
                    lightInstanceData.push({
                        rootPosition: corner,
                        lookAtTarget: landingPadCenter,
                        color: new Color3(1, 1, 0.8),
                        upDirection: landingPadUp,
                        range: 50 * landingPad.getPadSize(),
                        lampSize: 1 * landingPad.getPadSize(),
                        postHeight: 10 * landingPad.getPadSize(),
                        postDiameter: 0.4 * landingPad.getPadSize(),
                    });
                }
            }
        }

        this.landingPadLights = new ProceduralSpotLightInstances(degreesToRadians(120), scene);
        this.landingPadLights.getTransform().parent = this.getTransform();
        this.landingPadLights.setInstances(lightInstanceData);
        this.lights.push(...this.landingPadLights.lights);
    }

    setLandingPadStatus(landingPadIndex: number, status: LandingPadStatus) {
        const statusColor = new Color3();
        switch (status) {
            case LandingPadStatus.AVAILABLE:
                statusColor.copyFromFloats(1, 1, 0.8);
                break;
            case LandingPadStatus.OCCUPIED:
                statusColor.copyFromFloats(1, 0, 0);
                break;
        }
        this.landingPadLights.setColorAt(landingPadIndex * 4, statusColor);
        this.landingPadLights.setColorAt(landingPadIndex * 4 + 1, statusColor);
        this.landingPadLights.setColorAt(landingPadIndex * 4 + 2, statusColor);
        this.landingPadLights.setColorAt(landingPadIndex * 4 + 3, statusColor);
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
            if (isEnabled) {
                landingPad.enablePhysics(this.getTransform().getScene());
            } else {
                landingPad.disablePhysics();
            }
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

    getLights(): Array<Light> {
        return this.lights;
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.ring.dispose();

        this.landingPadLights.dispose();
        for (const light of this.lights) {
            light.dispose();
        }

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
    }
}
