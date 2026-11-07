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

import { Vector3 } from "@babylonjs/core/Maths/math";
import type { Mesh } from "@babylonjs/core/Meshes";
import type { Scene } from "@babylonjs/core/scene";

import { getBoundingRadius } from "../helpers/boundingRadius";
import type { Transformable } from "./architecture/transformable";
import type { CreateLinesMeshFunction } from "./lineRendering";

/**
 * Visual helper designed to display the rotation axis of given objects
 */
export class AxisRenderer {
    private readonly axisMeshes: Map<Transformable, Mesh> = new Map();

    private _isVisible = false;

    private readonly createAxisMeshFromPoints: CreateLinesMeshFunction;

    constructor(createAxisMeshFromPoints: CreateLinesMeshFunction) {
        this.createAxisMeshFromPoints = createAxisMeshFromPoints;
    }

    /**
     * Replaces the axis meshes with lines for the supplied orbital objects.
     * @param objects - The orbital objects whose rotation axes should be rendered.
     * @param scene - The Babylon.js scene that owns the rendered meshes.
     */
    setOrbitalObjects(objects: ReadonlyArray<Transformable>, scene: Scene): void {
        this.reset();

        for (const object of objects) {
            this.createAxisMesh(object, scene);
        }

        this.setVisibility(this._isVisible);
    }

    private createAxisMesh(orbitalObject: Transformable, scene: Scene): void {
        const points = [new Vector3(0, -0.5, 0), new Vector3(0, 0.5, 0)];

        const rotationAxisHelper = this.createAxisMeshFromPoints(
            `${orbitalObject.getTransform().name}AxisHelper`,
            points,
            { r: 0.4, g: 0.4, b: 0.4 },
            scene,
        );

        rotationAxisHelper.ignoreCameraMaxZ = true;
        rotationAxisHelper.alwaysSelectAsActiveMesh = true;

        this.axisMeshes.set(orbitalObject, rotationAxisHelper);
    }

    getAxisMesh(orbitalObject: Transformable): Mesh | undefined {
        return this.axisMeshes.get(orbitalObject);
    }

    /**
     * Shows or hides the meshes that represent orbital rotation axes.
     * @param visible - Whether the rotation-axis meshes should be shown.
     */
    setVisibility(visible: boolean): void {
        this._isVisible = visible;
        for (const axisMesh of this.axisMeshes.values()) {
            axisMesh.setEnabled(visible);
        }
    }

    /**
     * @returns true if the axis of rotations are currently displayed
     */
    isVisible(): boolean {
        return this._isVisible;
    }

    update(): void {
        if (!this._isVisible) {
            return;
        }

        for (const [object, axisMesh] of this.axisMeshes) {
            const transform = object.getTransform();
            const radius = getBoundingRadius(transform);

            axisMesh.scaling.y = 2 * radius * 1.5;
            axisMesh.position.copyFrom(transform.getAbsolutePosition());
            axisMesh.rotationQuaternion = transform.absoluteRotationQuaternion.clone();
            axisMesh.computeWorldMatrix(true);
        }
    }

    /**
     * Disposes the current axis meshes and clears the rendered set.
     */
    public reset(): void {
        this.axisMeshes.forEach((orbitMesh) => {
            orbitMesh.dispose(false, true);
        });
        this.axisMeshes.clear();
    }
}
