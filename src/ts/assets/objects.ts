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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import wanderer from "../../asset/spaceship/wanderer.glb";
import banana from "../../asset/banana/banana.glb";
import character from "../../asset/character/character.glb";
import rock from "../../asset/rock.glb";
import asteroid from "../../asset/asteroid/asteroid.glb";
import asteroid2 from "../../asset/asteroid/asteroid2.glb";
import tree from "../../asset/tree/tree.babylon";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import treeTexturePath from "../../asset/tree/Tree.png";
import { createButterfly } from "./procedural/butterfly/butterfly";
import { createGrassBlade } from "./procedural/grass/grassBlade";
import { LoadingScreen } from "../uberCore/loadingScreen";
import i18next from "../i18n";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import "@babylonjs/loaders";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/core/Animations/animatable";

import sphericalTank from "../../asset/SpaceStationParts/sphericalTank.glb";
import stationEngine from "../../asset/SpaceStationParts/engine.glb";

import { CollisionMask } from "../settings";
import { PhysicsShape, PhysicsShapeMesh, PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math";

export class Objects {
    private static WANDERER: Mesh;
    private static BANANA: Mesh;
    private static CHARACTER: Mesh;

    public static ROCK: Mesh;

    public static ASTEROIDS: Mesh[] = [];
    public static ASTEROID_PHYSICS_SHAPES: PhysicsShape[] = [];

    public static TREE: Mesh;

    public static BUTTERFLY: Mesh;
    public static GRASS_BLADES: Mesh[] = [];

    public static SPHERICAL_TANK: Mesh;
    public static SPHERICAL_TANK_PHYSICS_SHAPE: PhysicsShape;
    public static STATION_ENGINE: Mesh;

    public static CRATE: Mesh;

    public static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        const wandererTask = manager.addMeshTask("wandererTask", "", "", wanderer);
        wandererTask.onSuccess = function (task: MeshAssetTask) {
            Objects.WANDERER = task.loadedMeshes[0] as Mesh;

            for (const mesh of Objects.WANDERER.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Wanderer loaded");
        };

        const bananaTask = manager.addMeshTask("bananaTask", "", "", banana);
        bananaTask.onSuccess = function (task: MeshAssetTask) {
            Objects.BANANA = task.loadedMeshes[0] as Mesh;
            Objects.BANANA.isVisible = false;

            for (const mesh of Objects.BANANA.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Banana loaded");
        };

        const characterTask = manager.addMeshTask("characterTask", "", "", character);
        characterTask.onSuccess = function (task: MeshAssetTask) {
            Objects.CHARACTER = task.loadedMeshes[0] as Mesh;
            Objects.CHARACTER.isVisible = false;

            for (const mesh of Objects.CHARACTER.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Character loaded");
        };

        const rockTask = manager.addMeshTask("rockTask", "", "", rock);
        rockTask.onSuccess = function (task: MeshAssetTask) {
            Objects.ROCK = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
            Objects.ROCK.setParent(null);
            Objects.ROCK.position.y = 0.1;
            Objects.ROCK.scaling.scaleInPlace(0.2);
            Objects.ROCK.bakeCurrentTransformIntoVertices();
            Objects.ROCK.checkCollisions = true;
            Objects.ROCK.isVisible = false;

            console.log("Rock loaded");
        };

        const asteroidUrls = [asteroid, asteroid2];

        asteroidUrls.forEach((url, index) => {
            const asteroidTask = manager.addMeshTask(`asteroidTask${index}`, "", "", url);
            asteroidTask.onSuccess = function (task: MeshAssetTask) {
                const asteroid = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
                asteroid.setParent(null);
                asteroid.scaling.scaleInPlace(100);
                asteroid.bakeCurrentTransformIntoVertices();
                asteroid.setEnabled(false);

                Objects.ASTEROIDS.push(asteroid);

                const physicsShape = new PhysicsShapeMesh(asteroid, scene);
                physicsShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
                physicsShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

                Objects.ASTEROID_PHYSICS_SHAPES.push(physicsShape);

                const scalings = [0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.7, 1.9, 2.1];
                for (let i = 0; i < scalings.length; i++) {
                    const asteroidClone = asteroid.clone("asteroidClone" + i);
                    asteroidClone.makeGeometryUnique();
                    asteroidClone.setParent(null);
                    asteroidClone.scaling.scaleInPlace(scalings[i]);
                    asteroidClone.bakeCurrentTransformIntoVertices();
                    asteroidClone.setEnabled(false);

                    Objects.ASTEROIDS.push(asteroidClone);

                    const physicsShapeClone = new PhysicsShapeMesh(asteroidClone, scene);
                    physicsShapeClone.filterMembershipMask = CollisionMask.ENVIRONMENT;
                    physicsShapeClone.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

                    Objects.ASTEROID_PHYSICS_SHAPES.push(physicsShapeClone);
                }

                console.log(`Asteroid${index} loaded`);
            };
        });

        const treeTask = manager.addMeshTask("treeTask", "", "", tree);
        treeTask.onSuccess = function (task: MeshAssetTask) {
            Objects.TREE = task.loadedMeshes[0] as Mesh;
            Objects.TREE.position.y = -1;
            Objects.TREE.scaling.scaleInPlace(3);
            Objects.TREE.bakeCurrentTransformIntoVertices();
            Objects.TREE.checkCollisions = true;

            const treeMaterial = new StandardMaterial("treeMaterial", scene);

            treeMaterial.opacityTexture = null;
            treeMaterial.backFaceCulling = false;

            const treeTexture = new Texture(treeTexturePath, scene);
            treeTexture.hasAlpha = true;

            treeMaterial.diffuseTexture = treeTexture;
            treeMaterial.specularColor.set(0, 0, 0);

            Objects.TREE.material = treeMaterial;

            Objects.TREE.isVisible = false;

            console.log("Tree loaded");
        };

        const sphericalTankTask = manager.addMeshTask("SphericalTankTask", "", "", sphericalTank);
        sphericalTankTask.onSuccess = (task: MeshAssetTask) => {
            Objects.SPHERICAL_TANK = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
            Objects.SPHERICAL_TANK.parent = null;
            Objects.SPHERICAL_TANK.isVisible = false;

            const boundingBox = Objects.SPHERICAL_TANK.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            const targetDimension = 20;

            Objects.SPHERICAL_TANK.scaling.scaleInPlace(targetDimension / maxDimension);
            Objects.SPHERICAL_TANK.bakeCurrentTransformIntoVertices();

            //FIXME: the scaling of the radius is caused by an issue with the mesh
            Objects.SPHERICAL_TANK_PHYSICS_SHAPE = new PhysicsShapeSphere(Vector3.Zero(), targetDimension * 2.5, scene);

            console.log("SphericalTank loaded");
        };

        const stationEngineTask = manager.addMeshTask("StationEngineTask", "", "", stationEngine);
        stationEngineTask.onSuccess = (task: MeshAssetTask) => {
            Objects.STATION_ENGINE = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
            Objects.STATION_ENGINE.parent = null;
            Objects.STATION_ENGINE.isVisible = false;

            const boundingBox = Objects.STATION_ENGINE.getBoundingInfo().boundingBox;
            const maxDimension = Math.max(boundingBox.extendSize.x, boundingBox.extendSize.y, boundingBox.extendSize.z);

            Objects.STATION_ENGINE.scalingDeterminant = 1.0 / maxDimension;
            Objects.STATION_ENGINE.bakeCurrentTransformIntoVertices();

            console.log("StationEngine loaded");
        };

        Objects.BUTTERFLY = createButterfly(scene);
        Objects.BUTTERFLY.isVisible = false;

        Objects.GRASS_BLADES.push(createGrassBlade(scene, 3));
        Objects.GRASS_BLADES[0].isVisible = false;

        Objects.GRASS_BLADES.push(createGrassBlade(scene, 1));
        Objects.GRASS_BLADES[1].isVisible = false;

        Objects.CRATE = MeshBuilder.CreateBox("crate", { size: 1 }, scene);
        Objects.CRATE.isVisible = false;

        manager.onProgress = (remainingCount, totalCount) => {
            const loadingScreen = scene.getEngine().loadingScreen;
            if (loadingScreen instanceof LoadingScreen) {
                loadingScreen.setProgressPercentage((100 * (totalCount - remainingCount)) / totalCount);
            } else {
                loadingScreen.loadingUIText =
                    i18next.t("common:loading") +
                    " " +
                    ((100 * (totalCount - remainingCount)) / totalCount).toFixed(0) +
                    "%";
            }
        };
    }

    static CreateWandererInstance(): InstancedMesh {
        return Objects.WANDERER.instantiateHierarchy(null, {
            doNotInstantiate: false
        }) as InstancedMesh;
    }

    static CreateBananaInstance(): InstancedMesh {
        return Objects.BANANA.instantiateHierarchy(null, {
            doNotInstantiate: false
        }) as InstancedMesh;
    }

    static CreateBananaClone(sizeInMeters: number): Mesh {
        const mesh = Objects.BANANA.getChildMeshes()[0]?.clone("bananaClone" + Math.random(), null) as Mesh;
        mesh.scaling.scaleInPlace(5 * sizeInMeters);

        mesh.isVisible = true;

        return mesh;
    }

    static CreateCharacterInstance(): InstancedMesh {
        return Objects.CHARACTER.instantiateHierarchy(null, {
            doNotInstantiate: false
        }) as InstancedMesh;
    }
}
