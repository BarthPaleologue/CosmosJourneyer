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

import {
    Color3,
    CSG2,
    DirectionalLight,
    GIRSM,
    GIRSMManager,
    InitializeCSG2Async,
    Mesh,
    MeshBuilder,
    PBRMetallicRoughnessMaterial,
    ReflectiveShadowMap,
    SpotLight,
    Vector3,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";

export async function createShipInteriorScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    const controls = new DefaultControls(scene);
    controls.getTransform().position.set(0, 0, 10);

    // This attaches the camera to the canvas
    controls.getActiveCamera().attachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new SpotLight("light1", new Vector3(0, 1.5, 0), new Vector3(0, -1, 0), Math.PI * 0.99, 2, scene);
    light.intensity = 50;

    await InitializeCSG2Async();

    const livingRoomExtentZ = 3;

    const livingRoom = MeshBuilder.CreateBox(
        "livingRoom",
        { width: 6, depth: livingRoomExtentZ * 2, height: 3, sideOrientation: Mesh.BACKSIDE },
        scene,
    );

    const livingRoomCSG = CSG2.FromMesh(livingRoom);

    const doorExtentZ = 0.25;

    const doorOverlap = 0.05;

    const door = MeshBuilder.CreateBox("door", { width: 2, depth: doorExtentZ * 2, height: 2.2 }, scene);
    door.position.set(0, -0.4, -livingRoomExtentZ - doorExtentZ + doorOverlap);

    const doorCSG = CSG2.FromMesh(door);

    const flightCabinExtentZ = 1.5;

    const flightCabin = MeshBuilder.CreateBox(
        "flightCabin",
        { width: 2, depth: flightCabinExtentZ * 2, height: 2.2, sideOrientation: Mesh.BACKSIDE },
        scene,
    );
    flightCabin.position.set(0, -0.4, -livingRoomExtentZ - flightCabinExtentZ - doorExtentZ * 2 + doorOverlap);

    const flightCabinCSG = CSG2.FromMesh(flightCabin);

    const openedLivingRoomCSG = livingRoomCSG.subtract(doorCSG);

    const openedLivingRoom = openedLivingRoomCSG.toMesh("openedLivingRoom", scene);
    openedLivingRoom.position.y = -5;

    const pbrDefault = new PBRMetallicRoughnessMaterial("pbrDefault", scene);
    pbrDefault.baseColor = new Color3(1, 0.8, 0.8);
    pbrDefault.metallic = 0.0;
    pbrDefault.roughness = 0.7;

    livingRoom.material = pbrDefault;
    flightCabin.material = pbrDefault;

    openedLivingRoom.material = pbrDefault;

    const defaultRSMTextureRatio = 8;
    const defaultGITextureRatio = 2;

    const outputDimensions = {
        width: engine.getRenderWidth(true),
        height: engine.getRenderHeight(true),
    };

    const rsmTextureDimensions = {
        width: Math.floor(engine.getRenderWidth(true) / defaultRSMTextureRatio),
        height: Math.floor(engine.getRenderHeight(true) / defaultRSMTextureRatio),
    };

    const giTextureDimensions = {
        width: Math.floor(engine.getRenderWidth(true) / defaultGITextureRatio),
        height: Math.floor(engine.getRenderHeight(true) / defaultGITextureRatio),
    };

    const rsm = new ReflectiveShadowMap(scene, light, rsmTextureDimensions);
    rsm.addMesh();

    const girsm = new GIRSM(rsm);

    const giRSMMgr = new GIRSMManager(scene, outputDimensions, giTextureDimensions, 2048);

    giRSMMgr.addGIRSM([girsm]);

    giRSMMgr.enable = true;

    giRSMMgr.addMaterial(); // add all materials in the scene

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = scene.getEngine().getDeltaTime() / 1000;

        controls.update(deltaSeconds);
    });

    return Promise.resolve(scene);
}
