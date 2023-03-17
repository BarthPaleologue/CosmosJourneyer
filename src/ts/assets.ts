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

//import character from "../asset/man/man.obj";
import spaceship from "../asset/spaceship/spaceship.glb";
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

    //static Character: AbstractMesh;
    static Spaceship: Mesh;

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

            /*const characterTask = Assets.manager.addMeshTask("characterTask", "", "", character);
            characterTask.onSuccess = function (task: MeshAssetTask) {
                const meshes: Mesh[] = [];
                for (const mesh of task.loadedMeshes) {
                    if (mesh.hasBoundingInfo) meshes.push(mesh as Mesh);
                }
                Assets.Character = Mesh.MergeMeshes(meshes, true, true, undefined, false, true) as Mesh;
                Assets.Character.scaling = new Vector3(0.1, 0.1, 0.1);
                Assets.Character.isVisible = false;
                console.log("Character loaded");
            };*/

            const spaceshipTask = Assets.manager.addMeshTask("spaceshipTask", "", "", spaceship);
            spaceshipTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Spaceship = task.loadedMeshes[1] as Mesh;
                Assets.Spaceship.isVisible = false;

                const thrusterHelper = MeshBuilder.CreateBox("thruster1", { size: 0.5 }, scene);
                const cubeMaterial = new StandardMaterial("cubeMat", scene);
                cubeMaterial.diffuseColor = Color3.White();
                cubeMaterial.emissiveColor = Color3.White();
                cubeMaterial.useLogarithmicDepth = true;
                thrusterHelper.material = cubeMaterial;
                thrusterHelper.isVisible = false;
                thrusterHelper.position = new Vector3(4, 0, 0.5);

                const thrusterHelper2 = thrusterHelper.clone("thruster2");
                thrusterHelper2.position = new Vector3(4, 0, -0.5);

                thrusterHelper.parent = Assets.Spaceship;
                thrusterHelper2.parent = Assets.Spaceship;

                const pbr = Assets.Spaceship.material as PBRBaseMaterial;
                pbr.useLogarithmicDepth = true;

                console.log("Spaceship loaded");
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
        const spaceshipInstance = Assets.Spaceship.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
        const root = Assets.Spaceship.parent;
        // make copy of root node using JS 
        if (!root) throw new Error("Spaceship has no parent!");

        spaceshipInstance.setParent(root);

        return spaceshipInstance;
    }

    static DebugMaterial(name: string) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        mat.emissiveColor = Color3.Random();
        mat.useLogarithmicDepth = true;
        return mat;
    }
}
