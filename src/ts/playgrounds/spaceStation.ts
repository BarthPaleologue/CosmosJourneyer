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

import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { enablePhysics } from "./utils";
import { DefaultControls } from "../defaultControls/defaultControls";
import { SpaceStation } from "../spacestation/spaceStation";
import { newSeededSpaceStationModel } from "../spacestation/spaceStationModelGenerator";
import { Settings } from "../settings";
import { newSeededStarModel } from "../stellarObjects/star/starModelGenerator";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { Star } from "../stellarObjects/star/star";
import { Assets } from "../assets/assets";

export async function createSpaceStationScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    await Assets.Init(scene);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.maxZ = 100e3;
    camera.attachControl();

    scene.enableDepthRenderer(camera, false, true);

    const distanceToStar = Settings.AU;

    defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
    defaultControls.getTransform().lookAt(Vector3.Zero());

    const coordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0
    };

    const systemDatabase = new StarSystemDatabase();
    const systemPosition = systemDatabase.getSystemGalacticPosition(coordinates);

    const sunModel = newSeededStarModel(456, "Untitled Star", []);
    const sun = new Star(sunModel, scene);
    sun.getTransform().position = new Vector3(7, 2, 5).normalize().scaleInPlace(distanceToStar);

    const spaceStationModel = newSeededSpaceStationModel(
        Math.random() * Settings.SEED_HALF_RANGE,
        [sunModel],
        coordinates,
        systemPosition,
        [sunModel]
    );
    spaceStationModel.orbit.semiMajorAxis = distanceToStar;

    const spaceStation = new SpaceStation(spaceStationModel, scene);

    const ambient = new HemisphericLight("Sun", Vector3.Up(), scene);
    ambient.intensity = 0.1;

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        defaultControls.update(deltaSeconds);

        const cameraWorldPosition = camera.globalPosition;

        spaceStation.update([sun], [sun], cameraWorldPosition, deltaSeconds);
    });

    return scene;
}
