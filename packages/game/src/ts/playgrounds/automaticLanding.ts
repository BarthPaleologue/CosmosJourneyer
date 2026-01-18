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
    DirectionalLight,
    MeshBuilder,
    PBRMaterial,
    PhysicsAggregate,
    PhysicsShapeType,
    Quaternion,
} from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { randRange } from "extended-random";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { LandingPad } from "@/frontend/assets/procedural/spaceStation/landingPad/landingPad";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { CollisionMask } from "@/settings";

import { enablePhysics, enableShadows } from "./utils";

export async function createAutomaticLandingScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const soundPlayer = new SoundPlayerMock();

    const ship = await Spaceship.CreateDefault(scene, assets, soundPlayer);
    ship.getTransform().position.copyFromFloats(
        randRange(-50, 50, Math.random, 0),
        randRange(30, 50, Math.random, 0),
        randRange(-50, 50, Math.random, 0),
    );
    ship.getTransform().rotationQuaternion = Quaternion.Random().normalize();

    const defaultControls = new DefaultControls(scene);
    defaultControls.getTransform().position.copyFromFloats(0, 10, 75);
    defaultControls.speed *= 10;

    const camera = defaultControls.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    const landingPad = new LandingPad("Landing Pad", LandingPadSize.SMALL, assets.materials.landingPad, scene);

    const ground = MeshBuilder.CreateBox("ground", { width: 100, height: 1, depth: 100 }, scene);
    ground.position.y = -2;
    ground.position.x = 75;

    const groundMaterial = new PBRMaterial("groundMaterial", scene);
    groundMaterial.albedoColor.set(0.5, 0.5, 0.2);
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.9;
    ground.material = groundMaterial;

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    groundAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    const sun = new DirectionalLight("sun", new Vector3(1, -2, -1), scene);

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 0.1;

    enableShadows(sun);

    ship.engageLandingOnPad(landingPad);
    //ship.engageSurfaceLanding(ground);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        ship.update(deltaSeconds);

        defaultControls.update(deltaSeconds);
    });

    return scene;
}
