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

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateCylinder, Mesh, TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";

export class ThickLines {
    private readonly name: string;

    private points: TransformNode[] = [];

    private readonly cylinders: Mesh[] = [];

    private readonly material: StandardMaterial;

    private thickness: number;

    private readonly scene: Scene;

    constructor(
        name: string,
        {
            points,
            thickness,
            color
        }: {
            points: TransformNode[];
            thickness?: number;
            color?: Color3;
        },
        scene: Scene
    ) {
        this.name = name;

        this.thickness = thickness ?? 0.1;
        this.scene = scene;

        this.material = new StandardMaterial(`${name}Material`, scene);
        this.material.emissiveColor = color ?? Color3.White();

        this.setPoints(points);
    }

    public setPoints(points: TransformNode[]) {
        this.points = points;

        const targetNumberOfCylinders = Math.max(0, this.points.length - 1);
        const currentNumberOfCylinders = this.cylinders.length;

        // delete useless cylinders
        for (let i = targetNumberOfCylinders; i < currentNumberOfCylinders; i++) {
            this.cylinders[i].dispose();
        }

        // create new cylinders
        for (let i = currentNumberOfCylinders; i < targetNumberOfCylinders; i++) {
            const cylinder = CreateCylinder(
                `${this.name}Segment${i}`,
                {
                    height: 1,
                    diameter: this.thickness
                },
                this.scene
            );
            cylinder.material = this.material;
            this.cylinders.push(cylinder);
        }
    }

    public update() {
        for (let i = 0; i < this.points.length - 1; i++) {
            const cylinder = this.cylinders[i];
            const start = this.points[i].getAbsolutePosition();
            const end = this.points[i + 1].getAbsolutePosition();

            const middlePoint = start.add(end).scaleInPlace(0.5);
            const distance = end.subtract(start).length();

            cylinder.position = middlePoint;
            cylinder.scaling.y = Math.max(0, distance - 0.05);

            cylinder.lookAt(start);
            cylinder.rotate(Axis.X, Math.PI / 2, Space.LOCAL);
        }
    }
}
