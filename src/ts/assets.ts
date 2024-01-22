//  This file is part of CosmosJourneyer
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

import atmosphereLUT from "../shaders/textures/atmosphereLUT.glsl";

import seamlessPerlin from "../asset/perlin.png";
import warpNoise from "../asset/warpNoise.png";

import spaceship from "../asset/spaceship/spaceship2.glb";
import shipCarrier from "../asset/spacestation/shipcarrier.glb";
import banana from "../asset/banana/banana.glb";
import endeavorSpaceship from "../asset/spaceship/endeavour.glb";
import character from "../asset/character.glb";
import rock from "../asset/rock.glb";
import landingPad from "../asset/landingpad.glb";

import tree from "../asset/tree/tree.babylon";
import treeTexturePath from "../asset/tree/Tree.png";

import ouchSound from "../asset/sound/ouch.mp3";
import engineRunningSound from "../asset/sound/engineRunning.mp3";

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

export class Assets {
    static IS_READY = false;

    // Textures
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

    static Starfield: Texture;
    static PlumeParticle: Texture;

    static EmptyTexture: Texture;

    static AtmosphereLUT: ProceduralTexture;

    static WarpNoise: Texture;
    static SeamlessPerlin: Texture;

    private static Spaceship: Mesh;
    private static EndeavorSpaceship: Mesh;
    private static Spacestation: Mesh;
    private static Banana: Mesh;
    private static Character: Mesh;

    private static LandingPad: Mesh;

    public static Rock: Mesh;
    public static Tree: Mesh;
    public static ScatterCube: Mesh;

    public static Butterfly: Mesh;
    public static GrassBlade: Mesh;

    public static OuchSound: Sound;
    public static EngineRunningSound: Sound;

    private static manager: AssetsManager;

    static async Init(scene: Scene): Promise<void> {
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

        Assets.manager.addTextureTask("Starfield", starfield).onSuccess = (task) => (Assets.Starfield = task.texture);

        Assets.manager.addTextureTask("PlumeParticle", plumeParticle).onSuccess = (task) => (Assets.PlumeParticle = task.texture);

        Assets.manager.addTextureTask("SeamlessPerlin", seamlessPerlin).onSuccess = (task) => (Assets.SeamlessPerlin = task.texture);
        Assets.manager.addTextureTask("WarpNoise", warpNoise).onSuccess = (task) => (Assets.WarpNoise = task.texture);

        Assets.AtmosphereLUT = new ProceduralTexture("atmosphereLUT", 100, { fragmentSource: atmosphereLUT }, scene, undefined, false, false);
        Assets.AtmosphereLUT.refreshRate = 0;

        Assets.EmptyTexture = new Texture(null, scene);

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

        const characterTask = Assets.manager.addMeshTask("characterTask", "", "", character);
        characterTask.onSuccess = function (task: MeshAssetTask) {
            Assets.Character = task.loadedMeshes[0] as Mesh;
            Assets.Character.isVisible = false;

            for (const mesh of Assets.Character.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("Character loaded");
        };

        const rockTask = Assets.manager.addMeshTask("rockTask", "", "", rock);
        rockTask.onSuccess = function (task: MeshAssetTask) {
            Assets.Rock = task.loadedMeshes[0].getChildMeshes()[0] as Mesh;
            Assets.Rock.position.y = 0.1;
            Assets.Rock.scaling.scaleInPlace(0.2);
            Assets.Rock.bakeCurrentTransformIntoVertices();
            Assets.Rock.isVisible = false;

            console.log("Rock loaded");
        };

        const landingPadTask = Assets.manager.addMeshTask("landingPadTask", "", "", landingPad);
        landingPadTask.onSuccess = function (task: MeshAssetTask) {
            Assets.LandingPad = task.loadedMeshes[0] as Mesh;
            Assets.LandingPad.isVisible = false;

            for (const mesh of Assets.LandingPad.getChildMeshes()) {
                mesh.isVisible = false;
            }

            console.log("LandingPad loaded");
        };

        const treeTask = Assets.manager.addMeshTask("treeTask", "", "", tree);
        treeTask.onSuccess = function (task: MeshAssetTask) {
            Assets.Tree = task.loadedMeshes[0] as Mesh;
            Assets.Tree.position.y = -1;
            Assets.Tree.scaling.scaleInPlace(3);
            Assets.Tree.bakeCurrentTransformIntoVertices();

            const treeMaterial = new StandardMaterial("treeMaterial", scene);

            treeMaterial.opacityTexture = null;
            treeMaterial.backFaceCulling = false;

            const treeTexture = new Texture(treeTexturePath, scene);
            treeTexture.hasAlpha = true;

            treeMaterial.diffuseTexture = treeTexture;
            treeMaterial.specularColor.set(0, 0, 0);

            Assets.Tree.material = treeMaterial;

            Assets.Tree.isVisible = false;

            console.log("Tree loaded");
        };

        Assets.Butterfly = createButterfly(scene);

        Assets.GrassBlade = createGrassBlade(scene, 3);

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
            scene.getEngine().loadingScreen.loadingUIText = `Loading assets... ${totalCount - remainingCount}/${totalCount}`;
        };

        Assets.ScatterCube = MeshBuilder.CreateBox("cube", { size: 1 }, scene);
        Assets.ScatterCube.position.y = 0.5;
        Assets.ScatterCube.bakeCurrentTransformIntoVertices();
        Assets.ScatterCube.isVisible = false;

        Assets.manager.onFinish = () => {
            console.log("Assets loaded");
            Assets.IS_READY = true;
        };

        await Assets.manager.loadAsync();
    }

    static CreateSpaceShipInstance(): InstancedMesh {
        return Assets.Spaceship.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
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

    static CreateBananaClone(sizeInMeters: number): Mesh {
        const mesh = Assets.Banana.getChildMeshes()[0]?.clone("bananaClone" + Math.random(), null) as Mesh;
        mesh.scaling.scaleInPlace(5 * sizeInMeters);

        mesh.isVisible = true;

        return mesh;
    }

    static CreateCharacterInstance(): InstancedMesh {
        return Assets.Character.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateRockInstance(): InstancedMesh {
        return Assets.Rock.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
    }

    static CreateLandingPadInstance(): InstancedMesh {
        return Assets.LandingPad.instantiateHierarchy(null, { doNotInstantiate: false }) as InstancedMesh;
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
