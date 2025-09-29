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

import { type AssetContainer } from "@babylonjs/core/assetContainer";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PhysicsShapeMesh, type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { loadAssetInContainerAsync } from "./utils";

import asteroidPath from "@assets/asteroid/asteroid.glb";
import asteroid2Path from "@assets/asteroid/asteroid2.glb";

export type Asteroid = { mesh: Mesh; physicsShape: PhysicsShape };

export async function loadAsteroids(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Array<Asteroid>> {
    const assetContainers = await loadAsteroidModels(scene, progressMonitor);
    const scalings = [0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1] as const;

    const asteroids = assetContainers.flatMap((container) => processAsteroids(container, scalings));

    return asteroids.map((asteroid) => {
        return {
            mesh: asteroid,
            physicsShape: createAsteroidPhysicsShape(asteroid, scene),
        };
    });
}

export async function loadAsteroidModels(
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<AssetContainer[]> {
    const asteroidPromises = [
        loadAssetInContainerAsync("Asteroid1", asteroidPath, scene, progressMonitor),
        loadAssetInContainerAsync("Asteroid2", asteroid2Path, scene, progressMonitor),
    ];

    return Promise.all(asteroidPromises);
}

export function diversifyAsteroid(asteroid: Mesh, scalings: ReadonlyArray<number>) {
    const asteroids: Array<Mesh> = [];
    for (const scaling of scalings) {
        const asteroidClone = asteroid.clone(`asteroidClone${asteroids.length}`);
        asteroidClone.makeGeometryUnique();
        asteroidClone.setParent(null);
        asteroidClone.scaling.scaleInPlace(scaling);
        asteroidClone.bakeCurrentTransformIntoVertices();
        asteroids.push(asteroidClone);
    }

    return asteroids;
}

export function processAsteroids(container: AssetContainer, scalings: ReadonlyArray<number>) {
    const asteroids: Array<Mesh> = [];

    const asteroid = container.meshes[1];
    if (!(asteroid instanceof Mesh)) {
        throw new Error("Asteroid root node is not a Mesh");
    }

    asteroid.setParent(null);
    asteroid.scaling.scaleInPlace(100);
    asteroid.bakeCurrentTransformIntoVertices();

    asteroids.push(asteroid);

    asteroids.push(...diversifyAsteroid(asteroid, scalings));

    for (const asteroid of asteroids) {
        asteroid.setEnabled(false);
    }

    container.addAllToScene();

    return asteroids;
}

export function createAsteroidPhysicsShape(asteroid: Mesh, scene: Scene): PhysicsShape {
    const physicsShape = new PhysicsShapeMesh(asteroid, scene);
    physicsShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    physicsShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
    return physicsShape;
}
