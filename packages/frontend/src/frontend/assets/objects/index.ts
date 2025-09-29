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

import "@babylonjs/loaders";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/core/Animations/animatable";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeConvexHull, PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";

import { CollisionMask } from "@/settings";

import { type ILoadingProgressMonitor } from "../loadingProgressMonitor";
import { type Materials } from "../materials";
import { createButterfly } from "../procedural/butterfly/butterfly";
import { createGrassBlade } from "../procedural/grass/grassBlade";
import { loadAsteroids, type Asteroid } from "./asteroids";
import { loadCharacters, type Characters } from "./characters";
import { loadAssetInContainerAsync } from "./utils";

import bananaPath from "@assets/banana/banana.glb";
import rockPath from "@assets/rock.glb";
import wandererPath from "@assets/spaceship/wanderer.glb";
import stationEnginePath from "@assets/SpaceStationParts/engine.glb";
import sphericalTankPath from "@assets/SpaceStationParts/sphericalTank.glb";
import treePath from "@assets/tree/tree.babylon";

export type Objects = {
    crate: Mesh;
    grassBlades: [Mesh, Mesh];
    wanderer: Mesh;
    butterfly: Mesh;
    banana: Mesh;
    characters: Readonly<Characters>;
    rock: Mesh;
    asteroids: ReadonlyArray<Asteroid>;
    tree: Mesh;
    sphericalTank: {
        mesh: Mesh;
        shape: PhysicsShapeSphere;
    };
    stationEngine: {
        mesh: Mesh;
        shape: PhysicsShapeConvexHull;
    };
};

export async function loadObjects(
    materials: Materials,
    scene: Scene,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Objects> {
    // Start loading all mesh assets
    const wandererPromise = loadAssetInContainerAsync("Wanderer", wandererPath, scene, progressMonitor);
    const bananaPromise = loadAssetInContainerAsync("Banana", bananaPath, scene, progressMonitor);
    const characterPromise = loadCharacters(scene, progressMonitor);
    const rockPromise = loadAssetInContainerAsync("Rock", rockPath, scene, progressMonitor);
    const asteroidPromises = loadAsteroids(scene, progressMonitor);
    const treePromise = loadAssetInContainerAsync("Tree", treePath, scene, progressMonitor);
    const sphericalTankPromise = loadAssetInContainerAsync("SphericalTank", sphericalTankPath, scene, progressMonitor);
    const stationEnginePromise = loadAssetInContainerAsync("StationEngine", stationEnginePath, scene, progressMonitor);

    const butterfly = createButterfly(scene);
    butterfly.isVisible = false;
    butterfly.material = materials.butterfly;

    const grassBlades: [Mesh, Mesh] = [createGrassBlade(scene, 3), createGrassBlade(scene, 1)];
    grassBlades.forEach((blade) => {
        blade.material = materials.grass;
        blade.isVisible = false;
    });

    const crate = MeshBuilder.CreateBox("crate", { size: 1 }, scene);
    crate.isVisible = false;
    crate.material = materials.crate;

    const wandererContainer = await wandererPromise;
    const wanderer = wandererContainer.rootNodes[0];
    if (!(wanderer instanceof Mesh)) {
        throw new Error("Wanderer root node is not a Mesh");
    }

    for (const mesh of wanderer.getChildMeshes()) {
        mesh.isVisible = false;
    }

    wandererContainer.addAllToScene();

    const bananaContainer = await bananaPromise;
    const banana = bananaContainer.rootNodes[0];
    if (!(banana instanceof Mesh)) {
        throw new Error("Banana root node is not a Mesh");
    }

    banana.isVisible = false;
    for (const mesh of banana.getChildMeshes()) {
        mesh.isVisible = false;
    }

    bananaContainer.addAllToScene();

    const rockContainer = await rockPromise;
    const rock = rockContainer.meshes[1];
    if (!(rock instanceof Mesh)) {
        throw new Error("Rock root node is not a Mesh");
    }

    rock.setParent(null);
    rock.position.y = 0.1;
    rock.scaling.scaleInPlace(0.2);
    rock.bakeCurrentTransformIntoVertices();
    rock.checkCollisions = true;
    rock.isVisible = false;

    rockContainer.addAllToScene();

    const treeContainer = await treePromise;
    const tree = treeContainer.meshes[0];
    if (!(tree instanceof Mesh)) {
        throw new Error("Tree root node is not a Mesh");
    }

    tree.position.y = -1;
    tree.scaling.scaleInPlace(3);
    tree.bakeCurrentTransformIntoVertices();
    tree.checkCollisions = true;
    tree.isVisible = false;
    tree.material = materials.tree;

    treeContainer.addAllToScene();

    const sphericalTankContainer = await sphericalTankPromise;
    const sphericalTank = sphericalTankContainer.meshes[1];
    if (!(sphericalTank instanceof Mesh)) {
        throw new Error("SphericalTank root node is not a Mesh");
    }

    sphericalTank.parent = null;
    sphericalTank.isVisible = false;
    sphericalTankContainer.addAllToScene();

    const sphericalTankBoundingBox = sphericalTank.getBoundingInfo().boundingBox;
    const sphericalTankMaxDimension = Math.max(
        sphericalTankBoundingBox.extendSize.x,
        sphericalTankBoundingBox.extendSize.y,
        sphericalTankBoundingBox.extendSize.z,
    );

    const sphericalTankTargetDimension = 20;

    sphericalTank.scaling.scaleInPlace(sphericalTankTargetDimension / sphericalTankMaxDimension);
    sphericalTank.bakeCurrentTransformIntoVertices();

    const sphericalTankPhysicsShape = new PhysicsShapeSphere(Vector3.Zero(), sphericalTankTargetDimension * 2.5, scene);
    sphericalTankPhysicsShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    sphericalTankPhysicsShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    const stationEngineContainer = await stationEnginePromise;
    const stationEngine = stationEngineContainer.meshes[1];
    if (!(stationEngine instanceof Mesh)) {
        throw new Error("StationEngine root node is not a Mesh");
    }

    stationEngine.parent = null;
    stationEngine.isVisible = false;
    stationEngineContainer.addAllToScene();

    const boundingBox = stationEngine.getBoundingInfo().boundingBox;
    const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

    stationEngine.scalingDeterminant = 1.0 / maxDimension;
    stationEngine.bakeCurrentTransformIntoVertices();

    const stationEngineShape = new PhysicsShapeConvexHull(stationEngine, scene);
    stationEngineShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    stationEngineShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    return {
        stationEngine: {
            mesh: stationEngine,
            shape: stationEngineShape,
        },
        sphericalTank: {
            mesh: sphericalTank,
            shape: sphericalTankPhysicsShape,
        },
        tree,
        asteroids: await asteroidPromises,
        rock,
        characters: await characterPromise,
        banana,
        butterfly,
        grassBlades,
        crate,
        wanderer,
    };
}
