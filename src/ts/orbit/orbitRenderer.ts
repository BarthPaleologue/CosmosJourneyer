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
import { setUpVector } from "../uberCore/transforms/basicTransform";
import { getPointOnOrbitLocal } from "./orbit";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Scene } from "@babylonjs/core/scene";

export class OrbitRenderer {
    private orbitMeshes: LinesMesh[] = [];

    private orbitalObjects: OrbitalObject[] = [];

    private _isVisible = false;

    setOrbitalObjects(orbitalObjects: OrbitalObject[], scene: Scene) {
        this.reset();
        this.orbitalObjects = orbitalObjects;

        for (const orbitalObject of orbitalObjects) {
            this.createOrbitMesh(orbitalObject, scene);
        }

        this.setVisibility(this.isVisible());
    }

    private createOrbitMesh(orbitalObject: OrbitalObject, scene: Scene) {
        const orbit = orbitalObject.getOrbitProperties();
        const nbSteps = 1000;
        const timestep = orbit.period / nbSteps;
        const points: Vector3[] = [];

        for (let step = 0; step < nbSteps; step++) {
            const t = step * timestep;
            points.push(getPointOnOrbitLocal(orbit, t));
        }
        points.push(points[0]);

        const orbitMesh = MeshBuilder.CreateLines("orbit", { points: points }, scene);
        this.orbitMeshes.push(orbitMesh);
    }

    setVisibility(visible: boolean) {
        this._isVisible = visible;
        for (const orbitMesh of this.orbitMeshes) {
            orbitMesh.setEnabled(visible);
        }
    }

    isVisible(): boolean {
        return this._isVisible;
    }

    update() {
        if (!this._isVisible) return;
        for (let i = 0; i < this.orbitalObjects.length; i++) {
            const orbitalObject = this.orbitalObjects[i];
            const orbitMesh = this.orbitMeshes[i];

            orbitMesh.position = orbitalObject.parent?.getTransform().position ?? Vector3.Zero();
            orbitMesh.computeWorldMatrix(true);

            const normalToPlane = orbitalObject.getOrbitProperties().normalToPlane;
            setUpVector(orbitMesh, normalToPlane);
        }
    }

    private reset() {
        this.orbitMeshes.forEach((orbitMesh) => orbitMesh.dispose());
        this.orbitMeshes = [];
        this.orbitalObjects = [];
    }
}
