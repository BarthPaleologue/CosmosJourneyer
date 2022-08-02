import { AbstractMesh, AssetsManager, Color3, MeshAssetTask, Scene, StandardMaterial, Texture } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

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

import character from "../asset/Among_Us_Blend/amogus.glb";

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

    static Character: AbstractMesh;

    private static manager: AssetsManager;

    static onFinish: Function = () => {};

    static Init(scene: Scene) {
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

        const characterTask = Assets.manager.addMeshTask("characterTask", "", "", character);
        characterTask.onSuccess = function (task: MeshAssetTask) {
            Assets.Character = task.loadedMeshes[0];
            //TODO: removed that when we use it
            Assets.Character.setEnabled(false);
            console.log("Character loaded");
        };
        Assets.manager.onProgress = (remainingCount, totalCount, task) => {
            scene.getEngine().loadingUIText = `Loading assets... ${totalCount - remainingCount}/${totalCount}`;
        }
        Assets.manager.load();

        Assets.manager.onFinish = (tasks) => {
            console.log("Assets loaded");
            Assets.IS_READY = true;
            Assets.onFinish();
        };
    }

    static DebugMaterial(name: string) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        mat.emissiveColor = Color3.Random();
        return mat;
    }
}
