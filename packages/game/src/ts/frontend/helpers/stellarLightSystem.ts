//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import type { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

export class StellarLightSystem {
    private readonly stellarObjects: Array<{
        transform: TransformNode;
        light: DirectionalLight;
    }> = [];

    private readonly scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;
    }

    public registerStellarObject(transform: TransformNode, color: Color3) {
        const light = new DirectionalLight(`${transform.name}Light`, Vector3.Down(), this.scene);
        light.diffuse.copyFrom(color);

        this.stellarObjects.push({ transform, light });
    }

    public update(camera: Camera) {
        const cameraPosition = camera.globalPosition;
        for (const { transform, light } of this.stellarObjects) {
            const newDirection = cameraPosition.subtract(transform.getAbsolutePosition()).normalize();
            light.direction.copyFrom(newDirection);
        }
    }

    public getLights(): Array<DirectionalLight> {
        return this.stellarObjects.map(({ light }) => light);
    }

    public dispose() {
        for (const { light } of this.stellarObjects) {
            light.dispose();
        }
        this.stellarObjects.length = 0;
    }
}
