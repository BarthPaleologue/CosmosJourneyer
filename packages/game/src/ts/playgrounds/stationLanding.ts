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

import { DirectionalLight, GlowLayer } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";
import { newSeededSpaceStationModel } from "@/backend/universe/proceduralGenerators/orbitalFacilities/spaceStationModelGenerator";
import type { StarSystemModel } from "@/backend/universe/starSystemModel";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { TtsMock } from "@/frontend/audio/tts";
import { lookAt } from "@/frontend/helpers/transform";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";
import { SpaceStation } from "@/frontend/universe/orbitalFacility/spaceStation";

import { astronomicalUnitToMeters } from "@/utils/physics/unitConversions";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createStationLandingScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine, {
        useFloatingOrigin: true,
    });
    scene.useRightHandedSystem = true;
    scene.clearColor.set(0, 0, 0, 1);

    await enablePhysics(scene);

    const assets = await loadRenderingAssets(scene, progressMonitor);

    const tts = new TtsMock();
    const soundPlayer = new SoundPlayerMock();
    const notificationManager = new NotificationManagerMock();
    const shipControls = await ShipControls.CreateDefault(scene, assets, tts, soundPlayer, notificationManager);

    SpaceShipControlsInputs.setEnabled(true);

    const camera = shipControls.thirdPersonCamera;
    camera.maxZ = Settings.EARTH_RADIUS * 1e5;
    scene.activeCamera = camera;
    camera.attachControl();

    const distanceToStar = astronomicalUnitToMeters(1);

    const coordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    };

    const systemModel: StarSystemModel = {
        name: "Station Landing PG",
        coordinates: coordinates,
        stellarObjects: [getSunModel()],
        planets: [],
        satellites: [],
        anomalies: [],
        orbitalFacilities: [],
    };

    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get("seed");

    const spaceStationModel = newSeededSpaceStationModel(
        "station",
        seedParam !== null ? Number(seedParam) : Math.random() * Settings.SEED_HALF_RANGE,
        systemModel.stellarObjects[0],
        systemModel,
        { orbit: { semiMajorAxis: distanceToStar } },
    );

    const spaceStation = new SpaceStation(spaceStationModel, assets, scene);

    const landingBay = spaceStation.landingBays[0];
    if (landingBay === undefined) {
        throw new Error("Space station has no landing bay");
    }

    const spawnOnPadParam = urlParams.get("spawnOnPad");
    if (spawnOnPadParam !== null) {
        const landingPad = landingBay.landingPads[0];
        if (landingPad === undefined) {
            throw new Error("Landing bay has no landing pad");
        }
        shipControls.getSpaceship().spawnOnPad(landingPad);
    } else {
        landingBay.getTransform().position.addToRef(new Vector3(0, 3e3, 0), shipControls.getTransform().position);
        lookAt(shipControls.getTransform(), spaceStation.getTransform().position, scene.useRightHandedSystem);
    }

    shipControls.getTransform().computeWorldMatrix(true);
    shipControls.syncCameraTransform();
    shipControls.setClosestLandableFacility(spaceStation);

    new DirectionalLight("sun", new Vector3(-1, -1, 1).normalize(), scene);
    new GlowLayer("glow", scene);

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        shipControls.update(deltaSeconds);
        spaceStation.update([], camera.globalPosition, deltaSeconds);
    });

    return scene;
}
