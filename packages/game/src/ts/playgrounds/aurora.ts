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

import { CreateIcoSphere, DirectionalLight, Quaternion, Vector3 } from "@babylonjs/core";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import { astronomicalUnitToMeters, EarthMagneticDipoleMoment, SolarMass, SolarRadius } from "@cosmos-journeyer/physics";
import type { MagneticFieldModel } from "@cosmos-journeyer/universe-model";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadEnvironmentTextures } from "@/frontend/assets/textures/environment";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { CelestialBodyUberShaderPass } from "@/frontend/postProcesses/celestialBodyUberShader/celestialBodyUberShaderPass";
import { ColorCorrection } from "@/frontend/postProcesses/colorCorrection";
import { StarFieldBox } from "@/frontend/universe/starFieldBox";

import { Aurora } from "@/modules/aurora/aurora";
import { MagnetosphereGizmo } from "@/modules/magnetosphereGizmo/magnetosphereGizmo";

import { enablePointerLock } from "./utils";

/**
 * @param engine - Rendering engine.
 * @param progressMonitor - Asset-loading progress.
 * @returns Aurora PG scene.
 */
export async function createAuroraScene(
    engine: AbstractEngine,
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.clearColor.set(0, 0, 0, 1);
    scene.useRightHandedSystem = true;

    const planetRadius = 1000e3;

    const controls = new DefaultControls(scene);
    controls.speed = 500e3;
    const urlParams = new URLSearchParams(window.location.search);
    const showMagnetosphere = urlParams.get("magnetosphere") !== null;
    const seedParam = Number.parseInt(urlParams.get("seed") ?? "", 10);
    const auroraSeed = Number.isNaN(seedParam) ? 2200 : seedParam;
    if (showMagnetosphere) {
        // Far view to see the whole magnetosphere (standoff is ~10 planetary radii here).
        controls.getTransform().setAbsolutePosition(new Vector3(15.7e6, -1.05e6, -5.77e6));
        controls.getTransform().rotationQuaternion = Quaternion.RotationAxis(
            new Vector3(0.824, -0.037, 0.565).normalize(),
            degreesToRadians(177),
        );
    } else {
        controls
            .getTransform()
            .setAbsolutePosition(new Vector3(141_241.51561716784, -988_225.4300775495, 214_629.19221043558));
        controls.getTransform().rotationQuaternion = new Quaternion(
            0.6698526959666177,
            0.187368255518625,
            0.7148327639212441,
            -0.07214306726826886,
        );
    }

    const camera = controls.getActiveCamera();
    camera.minZ = 1e3;
    camera.maxZ = 40_000e3;
    camera.attachControl();

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new DirectionalLight("light1", new Vector3(0, 0, 1), scene);
    light.intensity = 0.7;

    const planet = CreateIcoSphere("Planet", { radius: planetRadius * 1.005, subdivisions: 11 }, scene);

    const depthRendererManager = new DepthRendererManager(scene);
    const atmosphere = new CelestialBodyUberShaderPass(
        {
            transform: planet,
            boundingRadius: planetRadius,
            emitsLight: false,
        },
        {
            atmosphere: new AtmosphereUniforms(planetRadius, 100e3),
            rings: null,
        },
        { stellarObjects: [light], shadowCasters: [] },
        depthRendererManager,
        scene,
    );
    camera.attachPostProcess(atmosphere.get());

    const magneticField: MagneticFieldModel = {
        north: {
            latitude: Math.PI / 2,
            longitude: 0,
        },
        magnitude: EarthMagneticDipoleMoment / 6 ** 3,
    };

    const aurora = new Aurora(planetRadius, magneticField, auroraSeed, scene);
    aurora.getTransform().parent = planet;

    const gizmo = new MagnetosphereGizmo(planetRadius, magneticField, scene);
    gizmo.getTransform().parent = planet;

    // Sun one astronomical unit away, matching the reference stellar wind.
    const windSources = [
        {
            mass: SolarMass,
            radius: SolarRadius,
            position: new Vector3(astronomicalUnitToMeters(1), 0, 0),
        },
    ];
    aurora.update(windSources);
    gizmo.update(windSources);

    const colorCorrection = new ColorCorrection("colorCorrection", scene);
    camera.attachPostProcess(colorCorrection.get());

    const textures = await loadEnvironmentTextures(scene, progressMonitor);
    new StarFieldBox(textures.milkyWay, 1000e6, scene);

    enablePointerLock(engine);

    scene.onBeforeRenderObservable.add(() => {
        controls.update(engine.getDeltaTime() / 1000);
    });

    scene.onBeforeCameraRenderObservable.add((activeCamera) => {
        depthRendererManager.setActiveCamera(activeCamera);
    });

    return scene;
}
