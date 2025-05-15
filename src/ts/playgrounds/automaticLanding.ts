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

import { MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion } from "@babylonjs/core";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { randRange } from "extended-random";

import { CollisionMask } from "@/settings";

import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { loadRenderingAssets } from "../assets/renderingAssets";
import { SoundPlayerMock } from "../audio/soundPlayer";
import { DefaultControls } from "../defaultControls/defaultControls";
import { LandingPadSize } from "../frontend/assets/procedural/spaceStation/landingPad/landingPadManager";
import { Spaceship } from "../frontend/spaceship/spaceship";
import { enablePhysics } from "./utils";

export async function createAutomaticLandingScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const assets = await loadRenderingAssets((loadedCount, totalCount, name) => {
        progressCallback(loadedCount / totalCount, `Loading ${name}`);
    }, scene);

    const soundPlayer = new SoundPlayerMock();

    const ship = Spaceship.CreateDefault(scene, assets, soundPlayer);
    ship.getTransform().position.copyFromFloats(
        randRange(-50, 50, Math.random, 0),
        randRange(30, 50, Math.random, 0),
        randRange(-50, 50, Math.random, 0),
    );
    ship.getTransform().rotationQuaternion = Quaternion.Random().normalize();

    const defaultControls = new DefaultControls(scene);
    defaultControls.getTransform().position.copyFromFloats(0, 10, -50);
    defaultControls.speed *= 10;

    const camera = defaultControls.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    new LandingPad(42, LandingPadSize.SMALL, assets, scene);

    const ground = MeshBuilder.CreateBox("ground", { width: 100, height: 1, depth: 100 }, scene);
    ground.position.y = -2;
    ground.position.x = 75;

    const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);
    groundAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
    groundAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 0.7;

    //ship.engageLandingOnPad(landingPad);
    ship.engageSurfaceLanding(ground);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        ship.update(deltaSeconds);

        defaultControls.update(deltaSeconds);
    });

    return scene;
}
