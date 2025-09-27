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

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { getSunModel } from "@/backend/universe/customSystems/sol/sun";
import { type StarModel } from "@/backend/universe/orbitalObjects/stellarObjects/starModel";
import { newSeededSpaceStationModel } from "@/backend/universe/proceduralGenerators/orbitalFacilities/spaceStationModelGenerator";
import { StarSystemDatabase } from "@/backend/universe/starSystemDatabase";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { SpaceStation } from "@/frontend/universe/orbitalFacility/spaceStation";
import { Star } from "@/frontend/universe/stellarObjects/star/star";

import { AU } from "@/utils/physics/constants";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createSpaceStationScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.maxZ = Settings.EARTH_RADIUS * 1e5;
    camera.attachControl();

    const distanceToStar = AU;

    defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 2, -3).normalize().scaleInPlace(40e3));
    lookAt(defaultControls.getTransform(), Vector3.Zero(), scene.useRightHandedSystem);

    const coordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    };

    const systemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const systemPosition = systemDatabase.getSystemGalacticPosition(coordinates);

    const sunModel: StarModel = getSunModel();

    const sun = new Star(sunModel, assets.textures, scene);
    sun.getTransform().position = new Vector3(7, 2, 5).normalize().scaleInPlace(distanceToStar);

    const spaceStationModel = newSeededSpaceStationModel(
        "station",
        Math.random() * Settings.SEED_HALF_RANGE,
        coordinates,
        systemPosition,
        [sunModel],
    );
    spaceStationModel.orbit.semiMajorAxis = distanceToStar;

    const spaceStation = new SpaceStation(spaceStationModel, new Map([[sunModel, distanceToStar]]), assets, scene);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        defaultControls.update(deltaSeconds);

        const cameraWorldPosition = camera.globalPosition;

        spaceStation.update([sun], cameraWorldPosition, deltaSeconds);
    });

    return scene;
}
