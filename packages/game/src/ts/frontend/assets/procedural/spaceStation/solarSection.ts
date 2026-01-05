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
import { type Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type AbstractMesh, type Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { type PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";
import { randRangeInt } from "extended-random";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { createEnvironmentAggregate } from "@/frontend/helpers/havok";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { wheelOfFortune } from "@/utils/random";

import { Settings } from "@/settings";

import { type SolarPanelMaterial } from "../solarPanel/solarPanelMaterial";
import { MetalSectionMaterial } from "./metalSectionMaterial";

export class SolarSection implements Transformable {
    private readonly attachment: Mesh;
    private attachmentAggregate: PhysicsAggregate | null = null;

    private readonly rng: (index: number) => number;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    private readonly solarPanels: AbstractMesh[] = [];
    private readonly solarPanelAggregates: PhysicsAggregate[] = [];

    private readonly metalSectionMaterial: Material;

    private readonly lights: Array<PointLight> = [];

    constructor(requiredSurface: number, seed: number, assets: RenderingAssets, scene: Scene) {
        this.rng = getRngFromSeed(seed);

        const axisCount = wheelOfFortune(
            [
                [1, 0.1],
                [2, 0.3],
                [3, 0.3],
                [4, 0.2],
                [5, 0.1],
            ],
            this.rng(0),
        );

        let attachmentLength = 200;

        if (axisCount === 1) {
            // in this case we will need a larger body to fit all the panels on the main attachment
            const sideSurface = requiredSurface / 2;
            const squareSideSize = Math.sqrt(sideSurface);

            attachmentLength = squareSideSize * 1.618;
        } else if (axisCount === 2) {
            attachmentLength = Math.sqrt(requiredSurface) * 1.2;
        }

        const attachmentRadius = 50;

        const attachmentTessellation = axisCount < 3 ? 6 : axisCount * 2;
        this.attachment = MeshBuilder.CreateCylinder(
            "SolarSectionAttachment",
            {
                diameter: attachmentRadius * 2,
                height: attachmentLength,
                tessellation: attachmentTessellation,
            },
            scene,
        );
        this.attachment.convertToFlatShadedMesh();

        this.metalSectionMaterial = new MetalSectionMaterial(
            "SolarSectionMetalMaterial",
            assets.textures.materials.metalPanels,
            scene,
        );
        this.attachment.material = this.metalSectionMaterial;

        const lampHeight = 30;
        const lightRadius = 5;
        const lightInstances = MeshBuilder.CreateCylinder(
            "utilitySectionLightMesh",
            { height: lampHeight, diameter: lightRadius * 2, tessellation: 6 },
            scene,
        );
        lightInstances.parent = this.getTransform();
        const lightMaterial = new StandardMaterial("utilitySectionLightMaterial", scene);
        lightMaterial.disableLighting = true;
        lightMaterial.emissiveColor = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
        lightInstances.material = lightMaterial;

        const lightPoints: Array<{ position: Vector3; rotation: Quaternion }> = [];
        const lightYStep = 200;
        for (
            let lightY = -attachmentLength / 2 + lightYStep;
            lightY <= attachmentLength / 2 - lightYStep;
            lightY += lightYStep
        ) {
            for (let sideIndex = 0; sideIndex < attachmentTessellation; sideIndex += 2) {
                const theta = ((2 * Math.PI) / attachmentTessellation) * sideIndex + Math.PI / attachmentTessellation;
                const lightPosition = new Vector3(
                    (attachmentRadius + lightRadius) * Math.cos(theta) * Math.cos(Math.PI / attachmentTessellation),
                    lightY,
                    (attachmentRadius + lightRadius) * Math.sin(theta) * Math.cos(Math.PI / attachmentTessellation),
                );
                lightPoints.push({ position: lightPosition, rotation: Quaternion.Identity() });
            }
        }

        if (axisCount === 1) {
            this.generateSpikePattern(
                this.getTransform(),
                attachmentLength,
                attachmentRadius,
                attachmentTessellation,
                requiredSurface,
                assets.materials.solarPanel,
            );
        } else if (axisCount === 2) {
            const secondaryArmLength = attachmentLength / 2.5;
            const secondaryArmTessellation = 6;
            const secondaryArmRadius = attachmentRadius;

            const secondaryArmCount = randRangeInt(2, 4, this.rng, 777);

            for (let secondaryArmIndex = 0; secondaryArmIndex < secondaryArmCount; secondaryArmIndex++) {
                const secondaryArm = MeshBuilder.CreateCylinder(
                    "Arm1",
                    {
                        height: secondaryArmLength,
                        diameter: secondaryArmRadius * 2,
                        tessellation: secondaryArmTessellation,
                    },
                    scene,
                );
                secondaryArm.convertToFlatShadedMesh();
                secondaryArm.parent = this.getTransform();
                secondaryArm.material = this.metalSectionMaterial;
                const rotation = Quaternion.RotationAxis(
                    Axis.Y,
                    (2 * Math.PI * secondaryArmIndex) / secondaryArmCount,
                ).multiply(Quaternion.RotationAxis(Axis.X, Math.PI / 2));
                secondaryArm.rotationQuaternion = rotation;
                secondaryArm.translate(
                    Axis.Y,
                    secondaryArmLength / 2 + attachmentRadius * Math.cos(Math.PI / attachmentTessellation),
                );

                const lightYStepArm = 200;
                for (
                    let lightY = lightYStepArm;
                    lightY <= secondaryArmLength - lightYStepArm;
                    lightY += lightYStepArm
                ) {
                    for (let sideIndex = 0; sideIndex < secondaryArmTessellation; sideIndex += 2) {
                        const theta =
                            ((2 * Math.PI) / secondaryArmTessellation) * sideIndex + Math.PI / secondaryArmTessellation;
                        const position = new Vector3(
                            (secondaryArmRadius + lightRadius) *
                                Math.cos(theta) *
                                Math.cos(Math.PI / secondaryArmTessellation),
                            lightY,
                            (secondaryArmRadius + lightRadius) *
                                Math.sin(theta) *
                                Math.cos(Math.PI / secondaryArmTessellation),
                        );
                        position.rotateByQuaternionToRef(rotation, position);

                        lightPoints.push({ position, rotation });
                    }
                }

                this.generateSpikePattern(
                    secondaryArm,
                    secondaryArmLength,
                    attachmentRadius / 2,
                    attachmentTessellation,
                    requiredSurface / secondaryArmCount,
                    assets.materials.solarPanel,
                );
            }
        } else if (axisCount >= 3) {
            this.generateStarPattern(axisCount, requiredSurface, assets.materials.solarPanel);
        }

        const lightInstanceBuffer = new Float32Array(lightPoints.length * 16);
        for (const [i, { position, rotation }] of lightPoints.entries()) {
            lightInstanceBuffer.set(Matrix.Compose(Vector3.OneReadOnly, rotation, position).asArray(), i * 16);
            const light = new PointLight(`SolarSectionLight${i}`, position, scene);
            light.range = 200;
            light.parent = this.getTransform();
            light.diffuse = Color3.FromHexString(Settings.FACILITY_LIGHT_COLOR);
            this.lights.push(light);
        }
        lightInstances.thinInstanceSetBuffer("matrix", lightInstanceBuffer, 16, true);
    }

    private generateSpikePattern(
        arm: TransformNode,
        armLength: number,
        armRadius: number,
        armTessellation: number,
        requiredSurface: number,
        solarPanelMaterial: SolarPanelMaterial,
    ) {
        const scene = this.getTransform().getScene();
        const halfRequiredSurface = requiredSurface / 2;
        const armSize = armLength;
        const nbPanelsPerSide = Math.ceil(armSize / 1000);

        const gap = 200;

        const panelDimensionY = armSize / nbPanelsPerSide - gap;
        const panelDimensionX = halfRequiredSurface / armSize;

        for (let i = 0; i < nbPanelsPerSide; i++) {
            const panel1 = MeshBuilder.CreateBox(
                "SolarPanel1",
                {
                    height: 0.3,
                    width: panelDimensionY,
                    depth: panelDimensionX,
                },
                scene,
            );
            panel1.parent = arm;
            panel1.material = solarPanelMaterial;
            panel1.translate(Axis.Y, (panelDimensionY + gap) * (i - (nbPanelsPerSide - 1) / 2));
            panel1.translate(Axis.Z, panelDimensionX / 2 + armRadius * Math.cos(Math.PI / armTessellation));
            panel1.rotate(Axis.Z, Math.PI / 2);
            this.solarPanels.push(panel1);

            const panel2 = panel1.clone("SolarPanel2");
            panel2.rotateAround(Vector3.Zero(), Axis.X, Math.PI);
            this.solarPanels.push(panel2);
        }
    }

    private generateStarPattern(nbArms: number, requiredSurface: number, solarPanelMaterial: SolarPanelMaterial) {
        const scene = this.getTransform().getScene();

        // there will be two solar array per arm, so the surface is distributed over 2*nbArms
        const surfacePerArm = requiredSurface / (2 * nbArms);
        const squareSideSize = Math.sqrt(surfacePerArm);
        const armLength = squareSideSize * 2.618;
        for (let i = 0; i <= nbArms; i++) {
            const armThickness = 100;
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
                {
                    height: armLength,
                    diameter: armThickness,
                    tessellation: 6,
                },
                scene,
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);

            const theta = (i / nbArms) * Math.PI * 2;
            arm.rotate(Axis.Y, theta, Space.WORLD);
            arm.translate(Axis.Y, armLength / 2, Space.LOCAL);
            arm.parent = this.getTransform();
            arm.material = this.metalSectionMaterial;
            this.arms.push(arm);

            const armOffset = (nbArms * 0.3 * surfacePerArm) / armLength;
            const hexagonOffset = armThickness * (1 - Math.sqrt(3) / 2);

            const solarPanel1 = MeshBuilder.CreateBox(
                "SolarPanel1",
                {
                    height: 0.3,
                    width: armLength,
                    depth: surfacePerArm / armLength,
                },
                scene,
            );
            solarPanel1.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            solarPanel1.parent = arm;
            solarPanel1.translate(Axis.X, armOffset);
            solarPanel1.translate(Axis.Z, 0.5 * (surfacePerArm / armLength + armThickness - hexagonOffset));
            solarPanel1.material = solarPanelMaterial;

            this.solarPanels.push(solarPanel1);

            const solarPanel2 = MeshBuilder.CreateBox(
                "SolarPanel2",
                {
                    height: 0.3,
                    width: armLength,
                    depth: surfacePerArm / armLength,
                },
                scene,
            );
            solarPanel2.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            solarPanel2.parent = arm;
            solarPanel2.translate(Axis.X, armOffset);
            solarPanel2.translate(Axis.Z, -0.5 * (surfacePerArm / armLength + armThickness - hexagonOffset));
            solarPanel2.material = solarPanelMaterial;

            this.solarPanels.push(solarPanel2);
        }
    }

    getLights(): Array<PointLight> {
        return this.lights;
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());

        if (distanceToCamera < 350e3 && this.attachmentAggregate === null) {
            this.attachmentAggregate = createEnvironmentAggregate(
                this.attachment,
                PhysicsShapeType.MESH,
                this.getTransform().getScene(),
            );
            this.arms.forEach((arm) => {
                const armAggregate = createEnvironmentAggregate(
                    arm,
                    PhysicsShapeType.MESH,
                    this.getTransform().getScene(),
                );
                this.armAggregates.push(armAggregate);
            });
            this.solarPanels.forEach((solarPanel) => {
                const solarPanelAggregate = createEnvironmentAggregate(
                    solarPanel,
                    PhysicsShapeType.BOX,
                    this.getTransform().getScene(),
                );
                this.solarPanelAggregates.push(solarPanelAggregate);
            });
        } else if (distanceToCamera > 360e3 && this.attachmentAggregate !== null) {
            this.attachmentAggregate.dispose();
            this.attachmentAggregate = null;

            this.armAggregates.forEach((armAggregate) => {
                armAggregate.dispose();
            });
            this.armAggregates.length = 0;

            this.solarPanelAggregates.forEach((solarPanelAggregate) => {
                solarPanelAggregate.dispose();
            });
            this.solarPanelAggregates.length = 0;
        }
    }

    public getTransform(): TransformNode {
        return this.attachment;
    }

    public dispose() {
        this.attachment.dispose();
        this.attachmentAggregate?.dispose();
        this.attachmentAggregate = null;

        this.arms.forEach((arm) => {
            arm.dispose();
        });
        this.armAggregates.forEach((armAggregate) => {
            armAggregate.dispose();
        });

        this.solarPanels.forEach((solarPanel) => {
            solarPanel.dispose();
        });
        this.solarPanelAggregates.forEach((solarPanelAggregate) => {
            solarPanelAggregate.dispose();
        });

        this.metalSectionMaterial.dispose();
    }
}
