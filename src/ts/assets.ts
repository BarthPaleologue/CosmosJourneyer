import "@babylonjs/loaders/glTF/2.0";
import "@babylonjs/core/Loading/loadingScreen";

import rockNormalMap from "../asset/textures/rockn.png";
import dirtNormalMap from "../asset/textures/dirt/Ground_Dirt_008_normal.jpg";
import bottomNormalMap from "../asset/textures/crackednormal.jpg";
import grassNormalMap from "../asset/textures/grass/normal.jpg";
import snowNormalMap1 from "../asset/textures/snow/Snow_002_NORM.jpg";
import snowNormalMap2 from "../asset/textures/snowNormalMap2.png";
import sandNormalMap1 from "../asset/textures/sand/normal.jpg";
import sandNormalMap2 from "../asset/textures/sandNormalMap2.jpg";
import waterNormal1 from "../asset/textures/waterNormalMap3.jpg";
import waterNormal2 from "../asset/textures/waterNormalMap4.jpg";

import atmosphereLUT from "../asset/textures/LUT/atmosphere.png";

import starfield from "../asset/textures/milkyway.jpg";

import spaceship from "../asset/spaceship/spaceship.glb";
import spacestation from "../asset/spacestation/spacestation.glb";
import banana from "../asset/banana/banana.glb";

import { ChunkForge } from "./chunks/chunkForge";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PBRBaseMaterial } from "@babylonjs/core/Materials/PBR/pbrBaseMaterial";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class Assets {
    static IS_READY = false;
    static RockNormalMap: Texture;
    static DirtNormalMap: Texture;
    static BottomNormalMap: Texture;
    static GrassNormalMap: Texture;
    static SnowNormalMap1: Texture;
    static SnowNormalMap2: Texture;
    static SandNormalMap1: Texture;
    static SandNormalMap2: Texture;
    static WaterNormalMap1: Texture;
    static WaterNormalMap2: Texture;

    static AtmosphereLUT: Texture;

    static Starfield: Texture;

    private static Spaceship: Mesh;
    private static Spacestation: Mesh;
    private static Banana: Mesh;

    static ChunkForge = new ChunkForge(64);

    private static manager: AssetsManager;

    static Init(scene: Scene): Promise<void> {
        return new Promise((resolve) => {
            Assets.manager = new AssetsManager(scene);
            console.log("Initializing assets...");

            Assets.manager.addTextureTask("RockNormalMap", rockNormalMap).onSuccess = (task) => (Assets.RockNormalMap = task.texture);
            Assets.manager.addTextureTask("DirtNormalMap", dirtNormalMap).onSuccess = (task) => (Assets.DirtNormalMap = task.texture);
            Assets.manager.addTextureTask("BottomNormalMap", bottomNormalMap).onSuccess = (task) => (Assets.BottomNormalMap = task.texture);
            Assets.manager.addTextureTask("GrassNormalMap", grassNormalMap).onSuccess = (task) => (Assets.GrassNormalMap = task.texture);
            Assets.manager.addTextureTask("SnowNormalMap1", snowNormalMap1).onSuccess = (task) => (Assets.SnowNormalMap1 = task.texture);
            Assets.manager.addTextureTask("SnowNormalMap2", snowNormalMap2).onSuccess = (task) => (Assets.SnowNormalMap2 = task.texture);
            Assets.manager.addTextureTask("SandNormalMap1", sandNormalMap1).onSuccess = (task) => (Assets.SandNormalMap1 = task.texture);
            Assets.manager.addTextureTask("SandNormalMap2", sandNormalMap2).onSuccess = (task) => (Assets.SandNormalMap2 = task.texture);
            Assets.manager.addTextureTask("WaterNormalMap1", waterNormal1).onSuccess = (task) => (Assets.WaterNormalMap1 = task.texture);
            Assets.manager.addTextureTask("WaterNormalMap2", waterNormal2).onSuccess = (task) => (Assets.WaterNormalMap2 = task.texture);

            Assets.manager.addTextureTask("AtmosphereLUT", atmosphereLUT).onSuccess = (task) => (Assets.AtmosphereLUT = task.texture);

            Assets.manager.addTextureTask("Starfield", starfield).onSuccess = (task) => (Assets.Starfield = task.texture);

            const spaceshipTask = Assets.manager.addMeshTask("spaceshipTask", "", "", spaceship);
            spaceshipTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Spaceship = task.loadedMeshes[0] as Mesh;

                for (const mesh of Assets.Spaceship.getChildMeshes()) {
                    mesh.isVisible = false;
                    const pbr = mesh.material as PBRBaseMaterial;
                    pbr.useLogarithmicDepth = true;
                }

                const thrusterHelper = MeshBuilder.CreateCylinder("mainThruster1", { height: 0.5, diameterTop: 0, diameterBottom: 0.5 }, scene);
                const cubeMaterial = new StandardMaterial("cubeMat", scene);
                cubeMaterial.diffuseColor = Color3.White();
                cubeMaterial.emissiveColor = Color3.White();
                cubeMaterial.useLogarithmicDepth = true;
                thrusterHelper.material = cubeMaterial;
                thrusterHelper.isVisible = false;
                thrusterHelper.position = new Vector3(0.5, 0, -4);
                thrusterHelper.rotation = new Vector3(-Math.PI / 2, 0, 0);

                const thrusterHelper2 = thrusterHelper.clone("mainThruster2");
                thrusterHelper2.position = new Vector3(-0.5, 0, -4);

                // Roll RCS 1

                const thrusterHelper31 = thrusterHelper.clone("rcsThruster11");
                thrusterHelper31.position = new Vector3(-0.5, -1, 0);
                thrusterHelper31.rotation = new Vector3(0, 0, Math.PI);

                const thrusterHelper32 = thrusterHelper.clone("rcsThruster12");
                thrusterHelper32.position = new Vector3(0.5, -1, 0);
                thrusterHelper32.rotation = new Vector3(0, 0, Math.PI);

                // Forward RCS

                const thrusterHelper4 = thrusterHelper.clone("rcsThruster2");
                thrusterHelper4.position = new Vector3(-0.5, 0, 5);
                thrusterHelper4.rotation = new Vector3(Math.PI / 2, 0, 0);

                const thrusterHelper5 = thrusterHelper.clone("rcsThruster3");
                thrusterHelper5.position = new Vector3(0.5, 0, 5);
                thrusterHelper5.rotation = new Vector3(Math.PI / 2, 0, 0);

                // Roll RCS 2

                const thrusterHelper61 = thrusterHelper.clone("rcsThruster41");
                thrusterHelper61.position = new Vector3(0.5, 1, 0);
                thrusterHelper61.rotation = new Vector3(0, 0, 0);

                const thrusterHelper62 = thrusterHelper.clone("rcsThruster42");
                thrusterHelper62.position = new Vector3(-0.5, 1, 0);
                thrusterHelper62.rotation = new Vector3(0, 0, 0);

                // Right-Left RCS

                const thrusterHelper7 = thrusterHelper.clone("rcsThruster5");
                thrusterHelper7.position = new Vector3(7, 0, 0);
                thrusterHelper7.rotation = new Vector3(0, 0, -Math.PI / 2);

                const thrusterHelper8 = thrusterHelper.clone("rcsThruster6");
                thrusterHelper8.position = new Vector3(-7, 0, 0);
                thrusterHelper8.rotation = new Vector3(0, 0, Math.PI / 2);

                // Pitch RCS

                const thrusterHelper91 = thrusterHelper.clone("rcsThruster7");
                thrusterHelper91.position = new Vector3(0, 1, 4);
                thrusterHelper91.rotation = new Vector3(0, 0, 0);

                const thrusterHelper92 = thrusterHelper.clone("rcsThruster8");
                thrusterHelper92.position = new Vector3(0, 1, -4);
                thrusterHelper92.rotation = new Vector3(0, 0, 0);

                const thrusterHelper93 = thrusterHelper.clone("rcsThruster9");
                thrusterHelper93.position = new Vector3(0, -1, 4);
                thrusterHelper93.rotation = new Vector3(0, 0, Math.PI);

                const thrusterHelper94 = thrusterHelper.clone("rcsThruster10");
                thrusterHelper94.position = new Vector3(0, -1, -4);
                thrusterHelper94.rotation = new Vector3(0, 0, Math.PI);

                // Yaw RCS

                const thrusterHelper101 = thrusterHelper.clone("rcsThruster11");
                thrusterHelper101.position = new Vector3(4, 0, 4);
                thrusterHelper101.rotation = new Vector3(Math.PI / 2, 0, 0);

                const thrusterHelper102 = thrusterHelper.clone("rcsThruster12");
                thrusterHelper102.position = new Vector3(-4, 0, 4);
                thrusterHelper102.rotation = new Vector3(Math.PI / 2, 0, 0);

                const thrusterHelper103 = thrusterHelper.clone("rcsThruster13");
                thrusterHelper103.position = new Vector3(4, 0, -7);
                thrusterHelper103.rotation = new Vector3(-Math.PI / 2, 0, 0);

                const thrusterHelper104 = thrusterHelper.clone("rcsThruster14");
                thrusterHelper104.position = new Vector3(-4, 0, -7);
                thrusterHelper104.rotation = new Vector3(-Math.PI / 2, 0, 0);

                thrusterHelper.parent = Assets.Spaceship;
                thrusterHelper2.parent = Assets.Spaceship;
                thrusterHelper31.parent = Assets.Spaceship;
                thrusterHelper32.parent = Assets.Spaceship;
                thrusterHelper4.parent = Assets.Spaceship;
                thrusterHelper5.parent = Assets.Spaceship;
                thrusterHelper61.parent = Assets.Spaceship;
                thrusterHelper62.parent = Assets.Spaceship;
                thrusterHelper7.parent = Assets.Spaceship;
                thrusterHelper8.parent = Assets.Spaceship;
                thrusterHelper91.parent = Assets.Spaceship;
                thrusterHelper92.parent = Assets.Spaceship;
                thrusterHelper93.parent = Assets.Spaceship;
                thrusterHelper94.parent = Assets.Spaceship;
                thrusterHelper101.parent = Assets.Spaceship;
                thrusterHelper102.parent = Assets.Spaceship;
                thrusterHelper103.parent = Assets.Spaceship;
                thrusterHelper104.parent = Assets.Spaceship;

                console.log("Spaceship loaded");
            };

            const spacestationTask = Assets.manager.addMeshTask("spacestationTask", "", "", spacestation);
            spacestationTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Spacestation = task.loadedMeshes[0] as Mesh;

                for (const mesh of Assets.Spacestation.getChildMeshes()) {
                    mesh.isVisible = false;
                    const pbr = mesh.material as PBRBaseMaterial;
                    pbr.useLogarithmicDepth = true;
                }

                console.log("Spacestation loaded");
            };

            const bananaTask = Assets.manager.addMeshTask("bananaTask", "", "", banana);
            bananaTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Banana = task.loadedMeshes[0] as Mesh;
                Assets.Banana.isVisible = false;

                for (const mesh of Assets.Banana.getChildMeshes()) {
                    mesh.isVisible = false;
                    const pbr = mesh.material as PBRBaseMaterial;
                    pbr.useLogarithmicDepth = true;
                }

                console.log("Banana loaded");
            };

            Assets.manager.onProgress = (remainingCount, totalCount) => {
                scene.getEngine().loadingUIText = `Loading assets... ${totalCount - remainingCount}/${totalCount}`;
            };
            Assets.manager.load();

            Assets.manager.onFinish = () => {
                console.log("Assets loaded");
                Assets.IS_READY = true;
                resolve();
            };
        });
    }

    static CreateSpaceShipInstance(): InstancedMesh {
        return Assets.Spaceship.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateSpaceStationInstance(): InstancedMesh {
        return Assets.Spacestation.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaInstance(): InstancedMesh {
        return Assets.Banana.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaClone(sizeInMeters = 0.2): Mesh {
        const mesh = Assets.Banana.clone("bananaClone").getChildMeshes()[0] as Mesh;
        mesh.isVisible = true;
        mesh.scaling.scaleInPlace(5 * sizeInMeters);

        return mesh;
    }

    static DebugMaterial(name: string) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        mat.emissiveColor = Color3.Random();
        mat.useLogarithmicDepth = true;
        return mat;
    }
}
