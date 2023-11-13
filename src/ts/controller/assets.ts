import "@babylonjs/loaders/glTF/2.0";
import "@babylonjs/core/Loading/loadingScreen";

import rockNormalMap from "../../asset/textures/rockn.png";
import dirtNormalMap from "../../asset/textures/dirt/Ground_Dirt_008_normal.jpg";
import bottomNormalMap from "../../asset/textures/crackednormal.jpg";
import grassNormalMap from "../../asset/textures/grass/normal.jpg";
import snowNormalMap1 from "../../asset/textures/snow/Snow_002_NORM.jpg";
import snowNormalMap2 from "../../asset/textures/snowNormalMap2.png";
import sandNormalMap1 from "../../asset/textures/sand/normal.jpg";
import sandNormalMap2 from "../../asset/textures/sandNormalMap2.jpg";
import waterNormal1 from "../../asset/textures/waterNormalMap3.jpg";
import waterNormal2 from "../../asset/textures/waterNormalMap4.jpg";

//import atmosphereLUT from "../../asset/textures/LUT/atmosphere.png";

import starfield from "../../asset/textures/milkyway.jpg";

import plumeParticle from "../../asset/textures/plume.png";

import spaceship from "../../asset/spaceship/spaceship2.glb";
import spacestation from "../../asset/spacestation/spacestation.glb";
import shipCarrier from "../../asset/spacestation/shipcarrier.glb";
import banana from "../../asset/banana/banana.glb";
import endeavorSpaceship from "../../asset/spaceship/endeavour.glb";

import ouchSound from "../../asset/sound/ouch.mp3";
import engineRunningSound from "../../asset/sound/engineRunning.mp3";

import { ChunkForge } from "./chunks/chunkForge";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AssetsManager, MeshAssetTask } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/core/Audio/audioSceneComponent";
import { Sound } from "@babylonjs/core/Audio/sound";

//import atmosphereLUT from "../../shaders/utils/atmosphereLUT.glsl";
import atmosphereLUT from "../../asset/textures/LUT/atmosphere.png";

import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Effect } from "@babylonjs/core/Materials/effect";

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

    static PlumeParticle: Texture;

    private static Spaceship: Mesh;
    private static EndeavorSpaceship: Mesh;
    private static Spacestation: Mesh;
    private static Banana: Mesh;

    public static OuchSound: Sound;
    public static EngineRunningSound: Sound;

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

            /*Assets.AtmosphereLUT = new ProceduralTexture("atmosphereLUT", 100, { fragmentSource: atmosphereLUT }, scene, undefined, false, false);
            Assets.AtmosphereLUT.refreshRate = 1;*/

            Assets.manager.addTextureTask("Starfield", starfield).onSuccess = (task) => (Assets.Starfield = task.texture);

            Assets.manager.addTextureTask("PlumeParticle", plumeParticle).onSuccess = (task) => (Assets.PlumeParticle = task.texture);

            const spaceshipTask = Assets.manager.addMeshTask("spaceshipTask", "", "", spaceship);
            spaceshipTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Spaceship = task.loadedMeshes[0] as Mesh;

                for (const mesh of Assets.Spaceship.getChildMeshes()) {
                    mesh.isVisible = false;
                }

                console.log("Spaceship loaded");
            };

            const endeavorSpaceshipTask = Assets.manager.addMeshTask("endeavorSpaceshipTask", "", "", endeavorSpaceship);
            endeavorSpaceshipTask.onSuccess = function (task: MeshAssetTask) {
                Assets.EndeavorSpaceship = task.loadedMeshes[0] as Mesh;

                for (const mesh of Assets.EndeavorSpaceship.getChildMeshes()) {
                    mesh.isVisible = false;
                }

                console.log("Endeavor Spaceship loaded");
            };

            const spacestationTask = Assets.manager.addMeshTask("spacestationTask", "", "", shipCarrier);
            spacestationTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Spacestation = task.loadedMeshes[0] as Mesh;

                for (const mesh of Assets.Spacestation.getChildMeshes()) {
                    mesh.isVisible = false;
                    //pbr._reflectionTexture = new Texture(starfield, scene);
                    //pbr._reflectionTexture.coordinatesMode = Texture.SPHERICAL_MODE;
                }

                console.log("Spacestation loaded");
            };

            const bananaTask = Assets.manager.addMeshTask("bananaTask", "", "", banana);
            bananaTask.onSuccess = function (task: MeshAssetTask) {
                Assets.Banana = task.loadedMeshes[0] as Mesh;
                Assets.Banana.isVisible = false;

                for (const mesh of Assets.Banana.getChildMeshes()) {
                    mesh.isVisible = false;
                }

                console.log("Banana loaded");
            };

            const ouchSoundTask = Assets.manager.addBinaryFileTask("ouchSoundTask", ouchSound);
            ouchSoundTask.onSuccess = function (task) {
                Assets.OuchSound = new Sound("OuchSound", task.data, scene);

                console.log("Ouch sound loaded");
            };

            const engineRunningSoundTask = Assets.manager.addBinaryFileTask("engineRunningSoundTask", engineRunningSound);
            engineRunningSoundTask.onSuccess = function (task) {
                Assets.EngineRunningSound = new Sound("EngineRunningSound", task.data, scene, null, {
                    loop: true
                });

                console.log("Engine running sound loaded");
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
        const instance = Assets.Spaceship.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
        for (const child of instance.getChildMeshes()) child.isVisible = true;

        return instance;
    }

    static CreateEndeavorSpaceShipInstance(): InstancedMesh {
        const instance = Assets.EndeavorSpaceship.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
        for (const child of instance.getChildMeshes()) child.isVisible = true;

        return instance;
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

    static DebugMaterial(name: string, diffuse = false, wireframe = false) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        if (!diffuse) mat.emissiveColor = Color3.Random();
        else mat.diffuseColor = Color3.Random();
        mat.wireframe = wireframe;
        return mat;
    }
}
