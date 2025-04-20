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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { enablePhysics } from "./utils";
import { DefaultControls } from "../defaultControls/defaultControls";
import { SpaceStation } from "../spacestation/spaceStation";
import { newSeededSpaceStationModel } from "../spacestation/spaceStationModelGenerator";
import { Settings } from "../settings";
import { StarSystemDatabase } from "../starSystem/starSystemDatabase";
import { Star } from "../stellarObjects/star/star";
import { AssetsManager } from "@babylonjs/core";
import { initMaterials } from "../assets/materials";
import { Objects } from "../assets/objects";
import { getLoneStarSystem } from "../starSystem/customSystems/loneStar";
import { StarModel } from "../stellarObjects/star/starModel";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { loadTextures } from "../assets/textures";
import { Assets2 } from "../assets/assets";

export async function createSpaceStationScene(engine: AbstractEngine): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    await enablePhysics(scene);

    const textures = await loadTextures(
        () => {},
        () => {},
        scene
    );

    const materials = initMaterials(textures, scene);

    const assets: Pick<Assets2, "textures" | "materials"> = {
        textures: textures,
        materials: materials
    };

    const assetsManager = new AssetsManager(scene);
    Objects.EnqueueTasks(assetsManager, scene);
    await assetsManager.loadAsync();

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.maxZ = Settings.EARTH_RADIUS * 1e5;
    camera.attachControl();

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

    const systemDatabase = new StarSystemDatabase(getLoneStarSystem());
    const systemPosition = systemDatabase.getSystemGalacticPosition(coordinates);

    const sunModel: StarModel = {
        type: OrbitalObjectType.STAR,
        id: "PGStar",
        name: "PG Star",
        blackBodyTemperature: 5778,
        mass: Settings.SOLAR_MASS,
        radius: Settings.SOLAR_RADIUS,
        orbit: {
            p: 2,
            argumentOfPeriapsis: 0,
            semiMajorAxis: 0,
            eccentricity: 0,
            longitudeOfAscendingNode: 0,
            inclination: 0,
            initialMeanAnomaly: 0,
            parentIds: []
        },
        siderealDaySeconds: 0,
        axialTilt: 0,
        seed: 0,
        rings: null
    };

    const sun = new Star(sunModel, assets.textures.pools, scene);
    sun.getTransform().position = new Vector3(7, 2, 5).normalize().scaleInPlace(distanceToStar);

    const spaceStationModel = newSeededSpaceStationModel(
        Math.random() * Settings.SEED_HALF_RANGE,
        coordinates,
        systemPosition,
        [sunModel]
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
