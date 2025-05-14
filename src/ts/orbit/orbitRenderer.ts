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

import { GreasedLineMeshColorMode } from "@babylonjs/core/Materials/GreasedLine/greasedLineMaterialInterfaces";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { CreateGreasedLine, GreasedLineBaseMesh } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";

import { OrbitalObject } from "../architecture/orbitalObject";
import { getOrbitalPeriod, getPointOnOrbitLocal } from "./orbit";

export class OrbitRenderer {
    private orbitMeshes: Map<OrbitalObject, GreasedLineBaseMesh> = new Map();

    private orbitalObjectToParents: Map<OrbitalObject, ReadonlyArray<OrbitalObject>> = new Map();

    private _isVisible = false;

    setOrbitalObjects(orbitalObjects: ReadonlyArray<OrbitalObject>, scene: Scene) {
        this.reset();

        for (const orbitalObject of orbitalObjects) {
            const parents = orbitalObjects.filter((parent) =>
                orbitalObject.model.orbit.parentIds.includes(parent.model.id),
            );

            this.createOrbitMesh(orbitalObject, parents, scene);

            this.orbitalObjectToParents.set(orbitalObject, parents);
        }

        this.setVisibility(this.isVisible());
    }

    private createOrbitMesh(orbitalObject: OrbitalObject, parents: ReadonlyArray<OrbitalObject>, scene: Scene) {
        const parentMassSum = parents.reduce((sum, parent) => sum + parent.model.mass, 0);

        const orbit = orbitalObject.model.orbit;
        const nbSteps = Math.max(100, Math.round(Math.sqrt(orbit.semiMajorAxis / 200e3)));
        const timestep = getOrbitalPeriod(orbit.semiMajorAxis, parentMassSum) / nbSteps;
        const points: Vector3[] = [];

        for (let step = 0; step < nbSteps; step++) {
            const t = step * timestep;
            points.push(getPointOnOrbitLocal(orbit, parentMassSum, t));
        }

        // wrap around
        if (points[0] !== undefined) {
            points.push(points[0]);
        }

        const orbitMesh = CreateGreasedLine(
            `${orbitalObject.getTransform().name}OrbitHelper`,
            {
                points: points,
                updatable: false,
            },
            {
                color: new Color3(0.4, 0.4, 0.4),
                width: 5,
                colorMode: GreasedLineMeshColorMode.COLOR_MODE_SET,
                sizeAttenuation: true,
            },
            scene,
        );
        this.orbitMeshes.set(orbitalObject, orbitMesh);
    }

    setVisibility(visible: boolean) {
        this._isVisible = visible;
        for (const orbitMesh of this.orbitMeshes.values()) {
            orbitMesh.setEnabled(visible);
        }
    }

    isVisible(): boolean {
        return this._isVisible;
    }

    update(referencePlaneRotation: Matrix) {
        if (!this._isVisible) return;
        for (const [orbitalObject, parents] of this.orbitalObjectToParents) {
            const orbitMesh = this.orbitMeshes.get(orbitalObject);
            if (orbitMesh === undefined) {
                throw new Error("Orbit mesh not found");
            }

            const parentBarycenter = Vector3.Zero();
            const massSum = parents.reduce((sum, parent) => sum + parent.model.mass, 0.001);
            for (const parent of parents) {
                parentBarycenter.addInPlace(parent.getTransform().position.scale(parent.model.mass));
            }
            parentBarycenter.scaleInPlace(1 / massSum);

            orbitMesh.position = parentBarycenter;
            orbitMesh.rotationQuaternion = Quaternion.FromRotationMatrix(referencePlaneRotation);
            orbitMesh.computeWorldMatrix(true);
        }
    }

    private reset() {
        this.orbitMeshes.forEach((orbitMesh) => {
            orbitMesh.dispose(false, true);
        });
        this.orbitMeshes.clear();
        this.orbitalObjectToParents.clear();
    }
}
