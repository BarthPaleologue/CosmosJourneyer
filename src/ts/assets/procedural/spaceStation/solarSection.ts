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

import { wheelOfFortune } from "../../../utils/wheelOfFortune";
import { Transformable } from "../../../architecture/transformable";
import { AbstractMesh, Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis, PhysicsAggregate, PhysicsShapeType, Scene } from "@babylonjs/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { SolarPanelMaterial } from "../solarPanel/solarPanelMaterial";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { createEnvironmentAggregate } from "../../../utils/physics";

export class SolarSection implements Transformable {
    private readonly attachment: Mesh;
    private readonly attachmentAggregate: PhysicsAggregate;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    private readonly solarPanels: AbstractMesh[] = [];
    private readonly solarPanelAggregates: PhysicsAggregate[] = [];

    private readonly metalSectionMaterial: MetalSectionMaterial;
    private readonly solarPanelMaterial: SolarPanelMaterial;

    constructor(requiredSurface: number, scene: Scene) {
        const nbArms = wheelOfFortune(
            [
                [1, 0.2],
                [2, 0.3],
                [3, 0.2],
                [4, 0.2],
                [5, 0.1]
            ],
            Math.random()
        );

        let attachmentLength = 200;

        if (nbArms === 1) {
            // in this case we will need a larger body to fit all the panels on the main attachment
            const sideSurface = requiredSurface / 2;
            const squareSideSize = Math.sqrt(sideSurface);

            attachmentLength = squareSideSize * 1.618;
        } else if (nbArms === 2) {
            attachmentLength = Math.sqrt(requiredSurface) * 1.2;
        }

        const attachmentThickness = 100;

        this.attachment = MeshBuilder.CreateCylinder(
            "SolarSectionAttachment",
            {
                diameter: attachmentThickness,
                height: attachmentLength,
                tessellation: nbArms < 3 ? 6 : nbArms * 2
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();

        this.metalSectionMaterial = new MetalSectionMaterial(scene);
        this.attachment.material = this.metalSectionMaterial;

        this.attachmentAggregate = createEnvironmentAggregate(this.attachment, PhysicsShapeType.MESH);

        this.solarPanelMaterial = new SolarPanelMaterial(scene);

        const hexagonOffset = attachmentThickness * (1 - Math.sqrt(3) / 2);

        if (nbArms === 1) {
            this.generateSpikePattern(this.getTransform(), attachmentLength, attachmentThickness, requiredSurface);
        } else if (nbArms === 2) {
            const armLength = attachmentLength / 2.5;

            const arm1 = MeshBuilder.CreateCylinder("Arm1", {
                height: armLength,
                diameter: attachmentThickness / 2,
                tessellation: 6
            }, scene);
            arm1.convertToFlatShadedMesh();
            arm1.parent = this.getTransform();
            arm1.material = this.metalSectionMaterial;
            arm1.rotate(Axis.X, Math.PI / 2);
            arm1.translate(Axis.Y, (armLength + attachmentThickness - hexagonOffset) / 2);

            this.createArmAggregate(arm1);

            this.generateSpikePattern(arm1, armLength, attachmentThickness / 2, requiredSurface / 2);

            const arm2 = MeshBuilder.CreateCylinder("Arm2", {
                height: armLength,
                diameter: attachmentThickness / 2,
                tessellation: 6
            }, scene);
            arm2.convertToFlatShadedMesh();
            arm2.parent = this.getTransform();
            arm2.material = this.metalSectionMaterial;
            arm2.rotate(Axis.X, -Math.PI / 2);
            arm2.translate(Axis.Y, (armLength + attachmentThickness - hexagonOffset) / 2);

            this.generateSpikePattern(arm2, armLength, attachmentThickness / 2, requiredSurface / 2);

            this.createArmAggregate(arm2);

        } else if (nbArms >= 3) {
            this.generateStarPattern(nbArms, requiredSurface);
        }
    }

    private generateSpikePattern(arm: TransformNode, armLength: number, armThickness: number, requiredSurface: number) {
        const scene = this.getTransform().getScene();
        const halfRequiredSurface = requiredSurface / 2;
        const armSize = armLength;
        const nbPanelsPerSide = Math.ceil(armSize / 1000);

        const gap = 200;

        const panelDimensionY = (armSize / nbPanelsPerSide) - gap;
        const panelDimensionX = halfRequiredSurface / armSize;

        const hexagonOffset = armThickness * (1 - Math.sqrt(3) / 2);

        for (let i = 0; i < nbPanelsPerSide; i++) {
            const panel1 = MeshBuilder.CreateBox("SolarPanel1", {
                height: 0.3,
                width: panelDimensionY,
                depth: panelDimensionX
            }, scene);
            panel1.parent = arm;
            panel1.material = this.solarPanelMaterial;
            panel1.translate(Axis.Y, (panelDimensionY + gap) * (i - (nbPanelsPerSide - 1) / 2));
            panel1.translate(Axis.Z, (panelDimensionX + armThickness - hexagonOffset) / 2);
            panel1.rotate(Axis.Z, Math.PI / 2);

            this.solarPanels.push(panel1);

            this.createSolarPanelAggregate(panel1);

            const panel2 = MeshBuilder.CreateBox("SolarPanel2", {
                height: 0.3,
                width: panelDimensionY,
                depth: panelDimensionX
            }, scene);
            panel2.parent = arm;
            panel2.material = this.solarPanelMaterial;
            panel2.translate(Axis.Y, (panelDimensionY + gap) * (i - (nbPanelsPerSide - 1) / 2));
            panel2.translate(Axis.Z, -(panelDimensionX + armThickness - hexagonOffset) / 2);
            panel2.rotate(Axis.Z, Math.PI / 2);

            this.solarPanels.push(panel2);

            this.createSolarPanelAggregate(panel2);
        }
    }

    private generateStarPattern(nbArms: number, requiredSurface: number) {
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
                    tessellation: 6
                },
                scene
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);

            const theta = (i / nbArms) * Math.PI * 2;
            arm.rotate(Axis.Y, theta, Space.WORLD);
            arm.translate(Axis.Y, armLength / 2, Space.LOCAL);
            arm.parent = this.getTransform();
            arm.material = this.metalSectionMaterial;
            this.arms.push(arm);

            this.createArmAggregate(arm);

            const armOffset = nbArms * 0.3 * surfacePerArm / armLength;
            const hexagonOffset = armThickness * (1 - Math.sqrt(3) / 2);

            const solarPanel1 = MeshBuilder.CreateBox("SolarPanel1", {
                height: 0.3,
                width: armLength,
                depth: surfacePerArm / armLength
            }, scene);
            solarPanel1.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            solarPanel1.parent = arm;
            solarPanel1.translate(Axis.X, armOffset);
            solarPanel1.translate(Axis.Z, 0.5 * (surfacePerArm / armLength + armThickness - hexagonOffset));
            solarPanel1.material = this.solarPanelMaterial;

            this.createSolarPanelAggregate(solarPanel1);

            const solarPanel2 = MeshBuilder.CreateBox("SolarPanel2", {
                height: 0.3,
                width: armLength,
                depth: surfacePerArm / armLength
            }, scene);
            solarPanel2.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            solarPanel2.parent = arm;
            solarPanel2.translate(Axis.X, armOffset);
            solarPanel2.translate(Axis.Z, -0.5 * (surfacePerArm / armLength + armThickness - hexagonOffset));
            solarPanel2.material = this.solarPanelMaterial;

            this.createSolarPanelAggregate(solarPanel2);
        }
    }

    private createSolarPanelAggregate(panel: Mesh): PhysicsAggregate {
        const panelAggregate = createEnvironmentAggregate(panel, PhysicsShapeType.BOX);
        this.solarPanelAggregates.push(panelAggregate);
        return panelAggregate;
    }

    private createArmAggregate(arm: Mesh): PhysicsAggregate {
        const armAggregate = createEnvironmentAggregate(arm, PhysicsShapeType.MESH);
        this.armAggregates.push(armAggregate);
        return armAggregate;
    }

    update(stellarObjects: Transformable[]) {
        this.solarPanelMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
    }

    public getTransform(): TransformNode {
        return this.attachment;
    }

    public dispose() {
        this.attachment.dispose();
        this.attachmentAggregate.dispose();

        this.arms.forEach(arm => arm.dispose());
        this.armAggregates.forEach(armAggregate => armAggregate.dispose());

        this.solarPanels.forEach(solarPanel => solarPanel.dispose());
        this.solarPanelAggregates.forEach(solarPanelAggregate => solarPanelAggregate.dispose());

        this.solarPanelMaterial.dispose();
        this.metalSectionMaterial.dispose();
    }
}