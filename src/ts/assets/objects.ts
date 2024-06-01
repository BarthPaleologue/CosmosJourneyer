//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import spaceship from "../../asset/spaceship/spaceship2.glb";
import endeavorSpaceship from "../../asset/spaceship/endeavour.glb";
import wanderer from "../../asset/spaceship/wanderer.glb";
import shipCarrier from "../../asset/spacestation/shipcarrier.glb";
import banana from "../../asset/banana/banana.glb";
import character from "../../asset/character/character.glb";
import rock from "../../asset/rock.glb";
import landingPad from "../../asset/landingpad.glb";
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

export class Objects {
    private static SPACESHIP: Mesh;
    private static ENDEAVOR_SPACESHIP: Mesh;
    private static WANDERER: Mesh;
    private static SPACE_STATION: Mesh;
    private static BANANA: Mesh;
    private static CHARACTER: Mesh;

    private static LANDING_PAD: Mesh;

    public static ROCK: Mesh;
    public static TREE: Mesh;

    public static BUTTERFLY: Mesh;
    public static GRASS_BLADE: Mesh;
    
    public static EnqueueTasks(manager: AssetsManager, scene: Scene) {
        const spaceshipTask = manager.addMeshTask("spaceshipTask", "", "", spaceship);
        spaceshipTask.onSuccess = function (task: MeshAssetTask) {
            Objects.SPACESHIP = task.loadedMeshes[0] as Mesh;

            for (const mesh of Objects.SPACESHIP.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Spaceship loaded");
        };

        const endeavorSpaceshipTask = manager.addMeshTask("endeavorSpaceshipTask", "", "", endeavorSpaceship);
        endeavorSpaceshipTask.onSuccess = function (task: MeshAssetTask) {
            Objects.ENDEAVOR_SPACESHIP = task.loadedMeshes[0] as Mesh;

            for (const mesh of Objects.ENDEAVOR_SPACESHIP.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Endeavor Spaceship loaded");
        };

        const wandererTask = manager.addMeshTask("wandererTask", "", "", wanderer);
        wandererTask.onSuccess = function (task: MeshAssetTask) {
            Objects.WANDERER = task.loadedMeshes[0] as Mesh;

            for (const mesh of Objects.WANDERER.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Wanderer loaded");
        };

        const spacestationTask = manager.addMeshTask("spacestationTask", "", "", shipCarrier);
        spacestationTask.onSuccess = function (task: MeshAssetTask) {
            Objects.SPACE_STATION = task.loadedMeshes[0] as Mesh;

            for (const mesh of Objects.SPACE_STATION.getChildMeshes()) {
                mesh.isVisible = false;
                //pbr._reflectionTexture = new Texture(starfield, scene);
                //pbr._reflectionTexture.coordinatesMode = Texture.SPHERICAL_MODE;
            }

            console.log("Spacestation loaded");
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
            Objects.ROCK.position.y = 0.1;
            Objects.ROCK.scaling.scaleInPlace(0.2);
            Objects.ROCK.bakeCurrentTransformIntoVertices();
            Objects.ROCK.checkCollisions = true;
            Objects.ROCK.isVisible = false;

            console.log("Rock loaded");
        };

        const landingPadTask = manager.addMeshTask("landingPadTask", "", "", landingPad);
        landingPadTask.onSuccess = function (task: MeshAssetTask) {
            Objects.LANDING_PAD = task.loadedMeshes[0] as Mesh;
            Objects.LANDING_PAD.isVisible = false;

            for (const mesh of Objects.LANDING_PAD.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("LandingPad loaded");
        };

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

        Objects.BUTTERFLY = createButterfly(scene);
        Objects.BUTTERFLY.isVisible = false;

        Objects.GRASS_BLADE = createGrassBlade(scene, 3);
        Objects.GRASS_BLADE.isVisible = false;


        manager.onProgress = (remainingCount, totalCount) => {
            const loadingScreen = scene.getEngine().loadingScreen;
            if (loadingScreen instanceof LoadingScreen) {
                loadingScreen.setProgressPercentage((100 * (totalCount - remainingCount)) / totalCount);
            } else {
                loadingScreen.loadingUIText = i18next.t("common:loading") + " " + ((100 * (totalCount - remainingCount)) / totalCount).toFixed(0) + "%";
            }
        };
    }

    static CreateSpaceShipInstance(): InstancedMesh {
        return Objects.SPACESHIP.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateEndeavorSpaceShipInstance(): InstancedMesh {
        const instance = Objects.ENDEAVOR_SPACESHIP.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
        for (const child of instance.getChildMeshes()) child.isVisible = true;

        return instance;
    }

    static CreateWandererInstance(): InstancedMesh {
        return Objects.WANDERER.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateSpaceStationInstance(): InstancedMesh {
        return Objects.SPACE_STATION.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaInstance(): InstancedMesh {
        return Objects.BANANA.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaClone(sizeInMeters: number): Mesh {
        const mesh = Objects.BANANA.getChildMeshes()[0]?.clone("bananaClone" + Math.random(), null) as Mesh;
        mesh.scaling.scaleInPlace(5 * sizeInMeters);

        mesh.isVisible = true;

        return mesh;
    }

    static CreateCharacterInstance(): InstancedMesh {
        return Objects.CHARACTER.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateRockInstance(): InstancedMesh {
        return Objects.ROCK.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateLandingPadInstance(): InstancedMesh {
        return Objects.LANDING_PAD.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }
}