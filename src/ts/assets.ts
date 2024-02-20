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

import "@babylonjs/loaders";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Animations/animatable";

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

import starfield from "../asset/textures/milkyway.jpg";
import plumeParticle from "../asset/textures/plume.png";
import flareParticle from "../asset/flare.png";

import atmosphereLUT from "../shaders/textures/atmosphereLUT.glsl";

import seamlessPerlin from "../asset/perlin.png";
import warpNoise from "../asset/warpNoise.png";

import empty from "../asset/oneBlackPixel.png";

import spaceship from "../asset/spaceship/spaceship2.glb";
import shipCarrier from "../asset/spacestation/shipcarrier.glb";
import banana from "../asset/banana/banana.glb";
import endeavorSpaceship from "../asset/spaceship/endeavour.glb";
import character from "../asset/character/character.glb";
import rock from "../asset/rock.glb";
import landingPad from "../asset/landingpad.glb";

import tree from "../asset/tree/tree.babylon";
import treeTexturePath from "../asset/tree/Tree.png";

import ouchSound from "../asset/sound/ouch.mp3";
import engineRunningSound from "../asset/sound/engineRunning.mp3";
import menuHoverSound from "../asset/sound/166186__drminky__menu-screen-mouse-over.mp3";

import targetSound from "../asset/sound/702805__matrixxx__futuristic-inspect-sound-ui-or-in-game-notification.mp3";

import enableWarpDriveSound from "../asset/sound/386992__lollosound__17-distorzione.mp3";
import disableWarpDriveSound from "../asset/sound/204418__nhumphrey__large-engine.mp3";

import acceleratingWarpDriveSound from "../asset/sound/539503__timbre__endless-acceleration.mp3";
import deceleratingWarpDriveSound from "../asset/sound/539503__timbre_endless-deceleration.mp3";

import starMapBackgroundMusic from "../asset/sound/455855__andrewkn__wandering.mp3";

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

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { createButterfly } from "./proceduralAssets/butterfly/butterfly";
import { createGrassBlade } from "./proceduralAssets/grass/grassBlade";
import { ButterflyMaterial } from "./proceduralAssets/butterfly/butterflyMaterial";
import { GrassMaterial } from "./proceduralAssets/grass/grassMaterial";
import { Observable } from "@babylonjs/core/Misc/observable";

export class Assets {
    static IS_READY = false;

    // Textures
    static ROCK_NORMAL_MAP: Texture;
    static DIRT_NORMAL_MAP: Texture;
    static BOTTOM_NORMAL_MAP: Texture;
    static GRASS_NORMAL_MAP: Texture;
    static SNOW_NORMAL_MAP_1: Texture;
    static SNOW_NORMAL_MAP_2: Texture;
    static SAND_NORMAL_MAP_1: Texture;
    static SAND_NORMAL_MAP_2: Texture;
    static WATER_NORMAL_MAP_1: Texture;
    static WATER_NORMAL_MAP_2: Texture;

    static STAR_FIELD: Texture;
    static PLUME_PARTICLE: Texture;

    static FLARE_TEXTURE: Texture;

    static EMPTY_TEXTURE: Texture;

    static ATMOSPHERE_LUT: ProceduralTexture;

    static WARP_NOISE: Texture;
    static SEAMLESS_PERLIN: Texture;

    private static SPACESHIP: Mesh;
    private static ENDEAVOR_SPACESHIP: Mesh;
    private static SPACE_STATION: Mesh;
    private static BANANA: Mesh;
    private static CHARACTER: Mesh;

    private static LANDING_PAD: Mesh;

    public static ROCK: Mesh;
    public static TREE: Mesh;
    public static SCATTER_CUBE: Mesh;

    public static BUTTERFLY: Mesh;
    public static GRASS_BLADE: Mesh;

    public static BUTTERFLY_MATERIAL: ButterflyMaterial;
    public static GRASS_MATERIAL: GrassMaterial;

    public static OUCH_SOUND: Sound;
    public static ENGINE_RUNNING_SOUND: Sound;

    public static MENU_HOVER_SOUND: Sound;
    public static MENU_SELECT_SOUND: Sound;
    public static OPEN_PAUSE_MENU_SOUND: Sound;

    public static STAR_MAP_CLICK_SOUND: Sound;

    public static TARGET_LOCK_SOUND: Sound;
    public static TARGET_UNLOCK_SOUND: Sound;

    public static ENABLE_WARP_DRIVE_SOUND: Sound;
    public static DISABLE_WARP_DRIVE_SOUND: Sound;

    public static ACCELERATING_WARP_DRIVE_SOUND: Sound;
    public static DECELERATING_WARP_DRIVE_SOUND: Sound;

    public static STAR_MAP_BACKGROUND_MUSIC: Sound;
    public static MAIN_MENU_BACKGROUND_MUSIC: Sound;

    private static MANAGER: AssetsManager;

    static async Init(scene: Scene): Promise<void> {
        Assets.MANAGER = new AssetsManager(scene);
        Assets.MANAGER.autoHideLoadingUI = false;
        console.log("Initializing assets...");

        Assets.MANAGER.addTextureTask("RockNormalMap", rockNormalMap).onSuccess = (task) => (Assets.ROCK_NORMAL_MAP = task.texture);
        Assets.MANAGER.addTextureTask("DirtNormalMap", dirtNormalMap).onSuccess = (task) => (Assets.DIRT_NORMAL_MAP = task.texture);
        Assets.MANAGER.addTextureTask("BottomNormalMap", bottomNormalMap).onSuccess = (task) => (Assets.BOTTOM_NORMAL_MAP = task.texture);
        Assets.MANAGER.addTextureTask("GrassNormalMap", grassNormalMap).onSuccess = (task) => (Assets.GRASS_NORMAL_MAP = task.texture);
        Assets.MANAGER.addTextureTask("SnowNormalMap1", snowNormalMap1).onSuccess = (task) => (Assets.SNOW_NORMAL_MAP_1 = task.texture);
        Assets.MANAGER.addTextureTask("SnowNormalMap2", snowNormalMap2).onSuccess = (task) => (Assets.SNOW_NORMAL_MAP_2 = task.texture);
        Assets.MANAGER.addTextureTask("SandNormalMap1", sandNormalMap1).onSuccess = (task) => (Assets.SAND_NORMAL_MAP_1 = task.texture);
        Assets.MANAGER.addTextureTask("SandNormalMap2", sandNormalMap2).onSuccess = (task) => (Assets.SAND_NORMAL_MAP_2 = task.texture);
        Assets.MANAGER.addTextureTask("WaterNormalMap1", waterNormal1).onSuccess = (task) => (Assets.WATER_NORMAL_MAP_1 = task.texture);
        Assets.MANAGER.addTextureTask("WaterNormalMap2", waterNormal2).onSuccess = (task) => (Assets.WATER_NORMAL_MAP_2 = task.texture);

        Assets.MANAGER.addTextureTask("Starfield", starfield).onSuccess = (task) => (Assets.STAR_FIELD = task.texture);

        Assets.MANAGER.addTextureTask("PlumeParticle", plumeParticle).onSuccess = (task) => (Assets.PLUME_PARTICLE = task.texture);
        Assets.MANAGER.addTextureTask("FlareTexture", flareParticle).onSuccess = (task) => (Assets.FLARE_TEXTURE = task.texture);

        Assets.MANAGER.addTextureTask("SeamlessPerlin", seamlessPerlin).onSuccess = (task) => (Assets.SEAMLESS_PERLIN = task.texture);
        Assets.MANAGER.addTextureTask("WarpNoise", warpNoise).onSuccess = (task) => (Assets.WARP_NOISE = task.texture);

        Assets.ATMOSPHERE_LUT = new ProceduralTexture("atmosphereLUT", 100, { fragmentSource: atmosphereLUT }, scene, undefined, false, false);
        Assets.ATMOSPHERE_LUT.refreshRate = 0;

        Assets.MANAGER.addTextureTask("EmptyTexture", empty).onSuccess = (task) => (Assets.EMPTY_TEXTURE = task.texture);

        const spaceshipTask = Assets.MANAGER.addMeshTask("spaceshipTask", "", "", spaceship);
        spaceshipTask.onSuccess = function (task: MeshAssetTask) {
            Assets.SPACESHIP = task.loadedMeshes[0] as Mesh;

            for (const mesh of Assets.SPACESHIP.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Spaceship loaded");
        };

        const endeavorSpaceshipTask = Assets.MANAGER.addMeshTask("endeavorSpaceshipTask", "", "", endeavorSpaceship);
        endeavorSpaceshipTask.onSuccess = function (task: MeshAssetTask) {
            Assets.ENDEAVOR_SPACESHIP = task.loadedMeshes[0] as Mesh;

            for (const mesh of Assets.ENDEAVOR_SPACESHIP.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Endeavor Spaceship loaded");
        };

        const spacestationTask = Assets.MANAGER.addMeshTask("spacestationTask", "", "", shipCarrier);
        spacestationTask.onSuccess = function (task: MeshAssetTask) {
            Assets.SPACE_STATION = task.loadedMeshes[0] as Mesh;

            for (const mesh of Assets.SPACE_STATION.getChildMeshes()) {
                mesh.isVisible = false;
                //pbr._reflectionTexture = new Texture(starfield, scene);
                //pbr._reflectionTexture.coordinatesMode = Texture.SPHERICAL_MODE;
            }

            console.log("Spacestation loaded");
        };

        const bananaTask = Assets.MANAGER.addMeshTask("bananaTask", "", "", banana);
        bananaTask.onSuccess = function (task: MeshAssetTask) {
            Assets.BANANA = task.loadedMeshes[0] as Mesh;
            Assets.BANANA.isVisible = false;

            for (const mesh of Assets.BANANA.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Banana loaded");
        };

        const characterTask = Assets.MANAGER.addMeshTask("characterTask", "", "", character);
        characterTask.onSuccess = function (task: MeshAssetTask) {
            Assets.CHARACTER = task.loadedMeshes[0] as Mesh;
            Assets.CHARACTER.isVisible = false;

            for (const mesh of Assets.CHARACTER.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Character loaded");
        };

        const rockTask = Assets.MANAGER.addMeshTask("rockTask", "", "", rock);
        rockTask.onSuccess = function (task: MeshAssetTask) {
            Assets.ROCK = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
            Assets.ROCK.position.y = 0.1;
            Assets.ROCK.scaling.scaleInPlace(0.2);
            Assets.ROCK.bakeCurrentTransformIntoVertices();
            Assets.ROCK.checkCollisions = true;
            Assets.ROCK.isVisible = false;

            console.log("Rock loaded");
        };

        const landingPadTask = Assets.MANAGER.addMeshTask("landingPadTask", "", "", landingPad);
        landingPadTask.onSuccess = function (task: MeshAssetTask) {
            Assets.LANDING_PAD = task.loadedMeshes[0] as Mesh;
            Assets.LANDING_PAD.isVisible = false;

            for (const mesh of Assets.LANDING_PAD.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("LandingPad loaded");
        };

        const treeTask = Assets.MANAGER.addMeshTask("treeTask", "", "", tree);
        treeTask.onSuccess = function (task: MeshAssetTask) {
            Assets.TREE = task.loadedMeshes[0] as Mesh;
            Assets.TREE.position.y = -1;
            Assets.TREE.scaling.scaleInPlace(3);
            Assets.TREE.bakeCurrentTransformIntoVertices();
            Assets.TREE.checkCollisions = true;

            const treeMaterial = new StandardMaterial("treeMaterial", scene);

            treeMaterial.opacityTexture = null;
            treeMaterial.backFaceCulling = false;

            const treeTexture = new Texture(treeTexturePath, scene);
            treeTexture.hasAlpha = true;

            treeMaterial.diffuseTexture = treeTexture;
            treeMaterial.specularColor.set(0, 0, 0);

            Assets.TREE.material = treeMaterial;

            Assets.TREE.isVisible = false;

            console.log("Tree loaded");
        };

        Assets.BUTTERFLY = createButterfly(scene);
        Assets.BUTTERFLY.isVisible = false;
        Assets.BUTTERFLY_MATERIAL = new ButterflyMaterial(scene);
        Assets.BUTTERFLY.material = Assets.BUTTERFLY_MATERIAL;

        Assets.GRASS_BLADE = createGrassBlade(scene, 3);
        Assets.GRASS_BLADE.isVisible = false;
        Assets.GRASS_MATERIAL = new GrassMaterial(scene);
        Assets.GRASS_BLADE.material = Assets.GRASS_MATERIAL;

        const ouchSoundTask = Assets.MANAGER.addBinaryFileTask("ouchSoundTask", ouchSound);
        ouchSoundTask.onSuccess = function (task) {
            Assets.OUCH_SOUND = new Sound("OuchSound", task.data, scene);

            console.log("Ouch sound loaded");
        };

        const engineRunningSoundTask = Assets.MANAGER.addBinaryFileTask("engineRunningSoundTask", engineRunningSound);
        engineRunningSoundTask.onSuccess = function (task) {
            Assets.ENGINE_RUNNING_SOUND = new Sound("EngineRunningSound", task.data, scene, null, {
                loop: true
            });

            console.log("Engine running sound loaded");
        };

        const menuHoverSoundTask = Assets.MANAGER.addBinaryFileTask("menuHoverSoundTask", menuHoverSound);
        menuHoverSoundTask.onSuccess = function (task) {
            Assets.MENU_HOVER_SOUND = new Sound("MenuHoverSound", task.data, scene);
            Assets.MENU_HOVER_SOUND.updateOptions({
                playbackRate: 0.5
            });

            const clonedSound = Assets.MENU_HOVER_SOUND.clone();
            if(clonedSound === null) throw new Error("clonedSound is null");
            Assets.MENU_SELECT_SOUND = clonedSound;
            Assets.MENU_SELECT_SOUND.updateOptions({
                playbackRate: 1.0
            });

            const clonedSound2 = Assets.MENU_HOVER_SOUND.clone();
            if(clonedSound2 === null) throw new Error("clonedSound2 is null");
            Assets.OPEN_PAUSE_MENU_SOUND = clonedSound2;
            Assets.OPEN_PAUSE_MENU_SOUND.updateOptions({
                playbackRate: 0.75
            });

            console.log("Menu hover sound loaded");
        };

        const targetSoundTask = Assets.MANAGER.addBinaryFileTask("targetSoundTask", targetSound);
        targetSoundTask.onSuccess = function (task) {
            Assets.TARGET_LOCK_SOUND = new Sound("StarMapClickSound", task.data, scene);

            const clonedSound = Assets.TARGET_LOCK_SOUND.clone();
            if(clonedSound === null) throw new Error("clonedSound is null");
            Assets.TARGET_UNLOCK_SOUND = clonedSound;
            Assets.TARGET_UNLOCK_SOUND.updateOptions({
                playbackRate: 0.5
            });

            const clonedSound2 = Assets.TARGET_LOCK_SOUND.clone();
            if(clonedSound2 === null) throw new Error("clonedSound2 is null");
            Assets.STAR_MAP_CLICK_SOUND = clonedSound2;

            console.log("Target sound loaded");
        };

        const enableWarpDriveSoundTask = Assets.MANAGER.addBinaryFileTask("enableWarpDriveSoundTask", enableWarpDriveSound);
        enableWarpDriveSoundTask.onSuccess = function (task) {
            Assets.ENABLE_WARP_DRIVE_SOUND = new Sound("EnableWarpDriveSound", task.data, scene);
            Assets.ENABLE_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 2
            });

            console.log("Enable warp drive sound loaded");
        };

        const disableWarpDriveSoundTask = Assets.MANAGER.addBinaryFileTask("disableWarpDriveSoundTask", disableWarpDriveSound);
        disableWarpDriveSoundTask.onSuccess = function (task) {
            Assets.DISABLE_WARP_DRIVE_SOUND = new Sound("DisableWarpDriveSound", task.data, scene);

            console.log("Disable warp drive sound loaded");
        };

        const acceleratingWarpDriveSoundTask = Assets.MANAGER.addBinaryFileTask("acceleratingWarpDriveSoundTask", acceleratingWarpDriveSound);
        acceleratingWarpDriveSoundTask.onSuccess = function (task) {
            Assets.ACCELERATING_WARP_DRIVE_SOUND = new Sound("AcceleratingWarpDriveSound", task.data, scene);
            Assets.ACCELERATING_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 1.0,
                volume: 0.1,
                loop: true
            });

            console.log("Accelerating warp drive sound loaded");
        };

        const deceleratingWarpDriveSoundTask = Assets.MANAGER.addBinaryFileTask("deceleratingWarpDriveSoundTask", deceleratingWarpDriveSound);
        deceleratingWarpDriveSoundTask.onSuccess = function (task) {
            Assets.DECELERATING_WARP_DRIVE_SOUND = new Sound("DeceleratingWarpDriveSound", task.data, scene);
            Assets.DECELERATING_WARP_DRIVE_SOUND.updateOptions({
                playbackRate: 1.0,
                volume: 0.1,
                loop: true
            });

            console.log("Decelerating warp drive sound loaded");
        };

        const starMapBackgroundMusicTask = Assets.MANAGER.addBinaryFileTask("starMapBackgroundMusicTask", starMapBackgroundMusic);
        starMapBackgroundMusicTask.onSuccess = function (task) {
            Assets.STAR_MAP_BACKGROUND_MUSIC = new Sound("StarMapBackgroundMusic", task.data, scene, null, {
                loop: true
            });

            console.log("Star map background music loaded");
        };

        const mainMenuBackgroundMusicTask = Assets.MANAGER.addBinaryFileTask("mainMenuBackgroundMusicTask", starMapBackgroundMusic);
        const mainMenuBackgroundMusicLoaded = new Promise<void>((resolve) => {
            mainMenuBackgroundMusicTask.onSuccess = function(task) {
                Assets.MAIN_MENU_BACKGROUND_MUSIC = new Sound("MainMenuBackgroundMusic", task.data, scene, () => {
                    resolve();
                }, {
                    loop: true
                });

                console.log("Main menu background music loaded");
            };
        });

        Assets.MANAGER.onProgress = (remainingCount, totalCount) => {
            scene.getEngine().loadingScreen.loadingUIText = `Loading assets... ${totalCount - remainingCount}/${totalCount}`;
        };

        Assets.SCATTER_CUBE = MeshBuilder.CreateBox("cube", { size: 1 }, scene);
        Assets.SCATTER_CUBE.position.y = 0.5;
        Assets.SCATTER_CUBE.bakeCurrentTransformIntoVertices();
        Assets.SCATTER_CUBE.isVisible = false;

        Assets.MANAGER.onFinish = () => {
            console.log("Assets loaded");
            scene.getEngine().loadingScreen.loadingUIText = "Press F11 to go fullscreen";
            Assets.IS_READY = true;
        };

        await Assets.MANAGER.loadAsync();

        await mainMenuBackgroundMusicLoaded;
    }

    static CreateSpaceShipInstance(): InstancedMesh {
        return Assets.SPACESHIP.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateEndeavorSpaceShipInstance(): InstancedMesh {
        const instance = Assets.ENDEAVOR_SPACESHIP.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
        for (const child of instance.getChildMeshes()) child.isVisible = true;

        return instance;
    }

    static CreateSpaceStationInstance(): InstancedMesh {
        return Assets.SPACE_STATION.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaInstance(): InstancedMesh {
        return Assets.BANANA.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateBananaClone(sizeInMeters: number): Mesh {
        const mesh = Assets.BANANA.getChildMeshes()[0]?.clone("bananaClone" + Math.random(), null) as Mesh;
        mesh.scaling.scaleInPlace(5 * sizeInMeters);

        mesh.isVisible = true;

        return mesh;
    }

    static CreateCharacterInstance(): InstancedMesh {
        return Assets.CHARACTER.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateRockInstance(): InstancedMesh {
        return Assets.ROCK.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateLandingPadInstance(): InstancedMesh {
        return Assets.LANDING_PAD.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static DebugMaterial(name: string, diffuse = false, wireframe = false) {
        const mat = new StandardMaterial(`${name}DebugMaterial`);
        if (!diffuse) {
            mat.emissiveColor = Color3.Random();
            mat.disableLighting = true;
        } else mat.diffuseColor = Color3.Random();
        mat.wireframe = wireframe;
        return mat;
    }
}
