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

import { CreateSphere, DirectionalLight, GlowLayer, Matrix, PBRMaterial } from "@babylonjs/core";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";
import { generateSpaceElevatorModel } from "@/backend/universe/proceduralGenerators/orbitalFacilities/spaceElevatorModelGenerator";
import { generateTelluricPlanetModel } from "@/backend/universe/proceduralGenerators/telluricPlanetModelGenerator";
import type { StarSystemModel } from "@/backend/universe/starSystemModel";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadRenderingAssets } from "@/frontend/assets/renderingAssets";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { setOrbitalPosition, setRotation } from "@/frontend/universe/architecture/orbitalObjectUtils";
import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";
import { SpaceElevator } from "@/frontend/universe/orbitalFacility/spaceElevator";

import { astronomicalUnitToMeters } from "@/utils/physics/unitConversions";

import { Settings } from "@/settings";

import { enablePhysics } from "./utils";

export async function createSpaceElevatorScene(
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

    const defaultControls = new DefaultControls(scene);
    defaultControls.speed = 2000;

    const camera = defaultControls.getActiveCamera();
    camera.maxZ = Settings.EARTH_RADIUS * 1e5;
    camera.attachControl();

    const coordinates = {
        starSectorX: 0,
        starSectorY: 0,
        starSectorZ: 0,
        localX: 0,
        localY: 0,
        localZ: 0,
    };

    const sun = getSunModel();
    const planet = generateTelluricPlanetModel("dummy", 0, "Dummy", [sun], {
        orbit: { semiMajorAxis: astronomicalUnitToMeters(1) },
    });

    const systemModel: StarSystemModel = {
        name: "Space Elevator PG",
        coordinates: coordinates,
        stellarObjects: [sun],
        planets: [planet],
        satellites: [],
        anomalies: [],
        orbitalFacilities: [],
    };

    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get("seed");

    const spaceElevatorModel = generateSpaceElevatorModel(
        "station",
        seedParam !== null ? Number(seedParam) : Math.random() * Settings.SEED_HALF_RANGE,
        planet,
        systemModel,
    );

    const spaceElevator = new SpaceElevator(spaceElevatorModel, assets, scene);

    const landingBay = spaceElevator.landingBays[0];
    if (landingBay === undefined) {
        throw new Error("Space elevator has no landing bay");
    }

    const planetMesh = CreateSphere("planetMesh", { diameter: 2 * planet.radius, segments: 64 }, scene);
    const planetImpostor = new CustomOrbitalObject(planetMesh, { ...planet, type: "custom" });

    const planetMaterial = new PBRMaterial("planetMaterial", scene);
    planetMaterial.roughness = 0.7;
    planetMaterial.metallic = 0.0;
    planetMesh.material = planetMaterial;

    new DirectionalLight("sun", new Vector3(-1, -1, 1).normalize(), scene);

    new GlowLayer("glow", scene);

    const referencePlaneRotation = Matrix.Identity();
    let elapsedSeconds = 0;

    setOrbitalPosition(spaceElevator, [planetImpostor], referencePlaneRotation, elapsedSeconds);
    setRotation(spaceElevator, referencePlaneRotation, elapsedSeconds);
    spaceElevator.update([planetImpostor], Vector3.Zero(), elapsedSeconds);

    landingBay.getTransform().computeWorldMatrix(true);
    defaultControls.getTransform().position = landingBay
        .getTransform()
        .getAbsolutePosition()
        .add(spaceElevator.getTransform().up.scale(3e3));
    lookAt(defaultControls.getTransform(), spaceElevator.getTransform().position, scene.useRightHandedSystem);

    defaultControls.getTransform().setParent(spaceElevator.getTransform());

    scene.onBeforePhysicsObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        elapsedSeconds += deltaSeconds;

        defaultControls.update(deltaSeconds);

        const cameraWorldPosition = camera.globalPosition;

        setRotation(planetImpostor, referencePlaneRotation, elapsedSeconds);

        setOrbitalPosition(spaceElevator, [planetImpostor], referencePlaneRotation, elapsedSeconds);
        spaceElevator.update([planetImpostor], cameraWorldPosition, deltaSeconds);
    });

    return scene;
}
