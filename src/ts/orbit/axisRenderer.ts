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

import { LinesMesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { BoundingSphere } from "../architecture/boundingSphere";
import { Transformable } from "../architecture/transformable";
import { Scene } from "@babylonjs/core/scene";

/**
 * Visual helper designed to display the rotation axis of given objects
 */
export class AxisRenderer {
    private axisMeshes: LinesMesh[] = [];

    private _isVisible = false;

    /**
     * Disposes all previously created axis meshes by calling reset() and then creates new axis meshes for the given objects
     * @param objects
     * @param scene
     */
    setOrbitalObjects(objects: (Transformable & BoundingSphere)[], scene: Scene) {
        this.reset();

        for (const object of objects) {
            this.createAxisMesh(object, scene);
        }

        this.setVisibility(this._isVisible);
    }

    private createAxisMesh(orbitalObject: Transformable & BoundingSphere, scene: Scene) {
        const rotationAxisHelper = MeshBuilder.CreateLines(
            `RotationAxisHelper`,
            {
                points: [new Vector3(0, -orbitalObject.getBoundingRadius() * 2, 0), new Vector3(0, orbitalObject.getBoundingRadius() * 2, 0)]
            },
            scene
        );
        rotationAxisHelper.parent = orbitalObject.getTransform();
        this.axisMeshes.push(rotationAxisHelper);
    }

    /**
     * Set the visibility of the axis of rotations
     * @param visible
     */
    setVisibility(visible: boolean) {
        this._isVisible = visible;
        for (const axisMesh of this.axisMeshes) {
            axisMesh.setEnabled(visible);
        }
    }

    /**
     * @returns true if the axis of rotations are currently displayed
     */
    isVisible(): boolean {
        return this._isVisible;
    }

    /**
     * Dispose all axis meshes
     * @private
     */
    public reset() {
        this.axisMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.axisMeshes = [];
    }
}
