import { AssetsManager, Color3, Mesh, MeshAssetTask, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import "@babylonjs/loaders/glTF/2.0";

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
                const meshes: Mesh[] = [];
                for (const mesh of task.loadedMeshes) {
                    if (mesh.hasBoundingInfo) meshes.push(mesh as Mesh);
                }
                Assets.Spaceship = Mesh.MergeMeshes(meshes, true, true, undefined, false, true) as Mesh;
                Assets.Spaceship.isVisible = false;
                Assets.Spaceship.flipFaces(false);
                const spaceshipMat = new StandardMaterial("spaceshipMat", scene);
                spaceshipMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
                spaceshipMat.useLogarithmicDepth = true;
                Assets.Spaceship.material = spaceshipMat;
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

    static DebugMaterial(name: string) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        mat.emissiveColor = Color3.Random();
        mat.useLogarithmicDepth = true;
        return mat;
    }
}
