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
import { CreateBox, CreateTube, TransformNode } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { type Scene } from "@babylonjs/core/scene";

import { type PBRTextures } from "@/frontend/assets/textures/materials";
import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "@/frontend/universe/architecture/targetable";

import i18n from "@/i18n";

import { type SolarPanelMaterial } from "../../solarPanel/solarPanelMaterial";
import { MetalSectionMaterial } from "../metalSectionMaterial";
import { ClimberRingMaterial } from "./climberRingMaterial";

export class SpaceElevatorClimber implements Targetable {
    private readonly transform: TransformNode;

    private readonly solarPanelMaterial: Material;
    private readonly metalSectionMaterial: Material;

    private readonly boundingRadius: number;

    readonly targetInfo: TargetInfo;

    constructor(
        solarPanelMaterial: SolarPanelMaterial,
        climberTextures: PBRTextures,
        metalTextures: PBRTextures,
        scene: Scene,
    ) {
        this.transform = new TransformNode("SpaceElevatorClimber", scene);

        this.solarPanelMaterial = solarPanelMaterial;
        this.metalSectionMaterial = new MetalSectionMaterial(
            "SpaceElevatorClimberMetalSectionMaterial",
            metalTextures,
            scene,
        );

        const angleSubtracted = Math.PI / 6;
        const minAngle = -Math.PI / 2 + angleSubtracted / 2;
        const maxAngle = Math.PI / 2 - angleSubtracted / 2;
        const nbPoints = 64;

        const globalRadius = 100;
        const innerRadius = 10;

        const yThickness = 0.5;

        const rightPath = [];
        for (let theta = minAngle; theta <= maxAngle; theta += (maxAngle - minAngle) / nbPoints) {
            const x = Math.cos(theta) * globalRadius;
            const z = Math.sin(theta) * globalRadius;
            rightPath.push(new Vector3(x, 0, z));
        }

        const rightRing = CreateTube(
            "ClimberRightRing",
            {
                path: rightPath,
                cap: Mesh.CAP_ALL,
                radius: innerRadius,
            },
            scene,
        );
        rightRing.scaling.y = yThickness;
        rightRing.parent = this.transform;

        rightRing.material = new ClimberRingMaterial("ClimberRingMaterial", climberTextures, scene);

        const leftRing = rightRing.clone("ClimberLeftRing");
        leftRing.rotate(Axis.Y, Math.PI);

        const arm1 = CreateBox(
            "ClimberArm1",
            {
                height: globalRadius * 2,
                width: (innerRadius * yThickness) / 4,
                depth: (innerRadius * yThickness) / 4,
            },
            scene,
        );
        arm1.material = this.metalSectionMaterial;
        arm1.rotate(Axis.Z, Math.PI / 2, Space.WORLD);
        arm1.parent = this.transform;

        const armAngles = [Math.PI / 4, -Math.PI / 4];

        armAngles.forEach((angle, index) => {
            const arm = arm1.clone(`ClimberArm${index + 2}`);
            arm.rotate(Axis.Y, angle, Space.WORLD);
            arm.parent = this.transform;
        });

        const solarPanelWidth = 100;
        const solarPanelDepth = 20;
        const solarPanelThickness = 0.1;

        const solarPanelAngleSpacing = Math.PI / 6;

        const solarPanel1 = CreateBox(
            "ClimberSolarPanel1",
            {
                width: solarPanelWidth,
                height: solarPanelThickness,
                depth: solarPanelDepth,
            },
            scene,
        );
        solarPanel1.material = this.solarPanelMaterial;
        solarPanel1.position.x = globalRadius + solarPanelWidth / 2;
        solarPanel1.parent = this.transform;

        const angles = [
            solarPanelAngleSpacing,
            -solarPanelAngleSpacing,
            Math.PI + solarPanelAngleSpacing,
            Math.PI - solarPanelAngleSpacing,
            Math.PI,
        ];

        angles.forEach((angle, index) => {
            const solarPanel2 = solarPanel1.clone(`ClimberSolarPanel${index + 2}`);
            solarPanel2.parent = this.transform;
            solarPanel2.rotateAround(Vector3.Zero(), Axis.Y, angle);
        });

        this.boundingRadius = globalRadius + solarPanelWidth;

        this.targetInfo = {
            type: ObjectTargetCursorType.FACILITY,
            minDistance: this.getBoundingRadius() * 7.0,
            maxDistance: this.getBoundingRadius() * 3000,
        };
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:spaceElevatorClimber");
    }

    getTransform() {
        return this.transform;
    }

    dispose() {
        this.solarPanelMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.transform.dispose();
    }
}
