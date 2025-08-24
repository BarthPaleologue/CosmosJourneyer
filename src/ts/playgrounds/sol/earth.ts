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
    GizmoManager,
    Light,
    LightGizmo,
    Matrix,
    PointLight,
    Quaternion,
    Scene,
    Tools,
    Vector3,
    type WebGPUEngine,
} from "@babylonjs/core";

import { getEarthModel } from "@/backend/universe/customSystems/sol/earth";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type TerrainModel } from "@/backend/universe/orbitalObjects/terrainModel";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { loadIss } from "@/frontend/assets/objects/orbitalFacilities";
import { PlanetHeightMapAtlas } from "@/frontend/assets/planetHeightMapAtlas";
import { loadHeightMaps } from "@/frontend/assets/textures/heightMaps";
import {
    loadEarthAlbedo,
    loadEarthHighResolutionAlbedo,
    loadEarthHighResolutionNormal,
    loadEarthNormal,
} from "@/frontend/assets/textures/planetSurfaceTextures/earth";
import { createTexturePools } from "@/frontend/assets/textures/texturePools";
import { loadWaterTextures } from "@/frontend/assets/textures/water";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import { AtmosphericScatteringPostProcess } from "@/frontend/postProcesses/atmosphere/atmosphericScatteringPostProcess";
import { CloudsUniforms } from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { FlatCloudsPostProcess } from "@/frontend/postProcesses/clouds/flatCloudsPostProcess";
import { OceanPostProcess } from "@/frontend/postProcesses/ocean/oceanPostProcess";
import { OceanUniforms } from "@/frontend/postProcesses/ocean/oceanUniforms";
import { ChunkForgeCompute } from "@/frontend/terrain/sphere/chunkForgeCompute";
import { CustomPlanetMaterial } from "@/frontend/terrain/sphere/materials/customPlanetMaterial";
import { SphericalHeightFieldTerrain } from "@/frontend/terrain/sphere/sphericalHeightFieldTerrain";
import { getOrbitalPosition } from "@/frontend/universe/architecture/orbitalObjectUtils";
import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";

import { getAllRootTransformNodes } from "@/utils/scene";
import { type Texture2dUv } from "@/utils/texture";

/**
 * Build a LVLH → ECI (Earth‑Centered Inertial frame) rotation
 * @param nadir The up direction in ECI frame (nadir) (e.g. the direction towards the center of the Earth)
 * @param velocity The velocity vector in ECI frame (e.g. the direction of the spacecraft's velocity)
 * @returns Quaternion representing the rotation from LVLH to ECI
 */
function buildLvlhMatrix(nadir: Vector3, velocity: Vector3): Quaternion {
    const z = nadir; // nadir
    const x = velocity.normalizeToNew(); // prograde
    const y = Vector3.Cross(z, x).normalize();
    return Quaternion.FromRotationMatrix(Matrix.FromXYZAxesToRef(x, y, z, new Matrix()));
}

/** ISS body quaternion in ECI (Earth‑Centered Inertial frame), optionally trimmed to Torque‑Equilibrium Attitude (TEA). */
function issQuaternion(nadir: Vector3, velocity: Vector3): Quaternion {
    const orientationQuaternion = buildLvlhMatrix(nadir, velocity);

    // steady‑state TEA offsets (roll +0.9°, pitch –6°, yaw 0°)
    const torqueEquilibriumAttitude = Quaternion.RotationYawPitchRoll(0, Tools.ToRadians(-6), Tools.ToRadians(0.9));

    return torqueEquilibriumAttitude.multiply(orientationQuaternion);
}

export async function createEarthScene(
    engine: WebGPUEngine,
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.defaultCursor = "default";
    scene.clearColor.set(0, 0, 0, 1);

    const waterTextures = await loadWaterTextures(scene, progressMonitor);

    const texturePools = createTexturePools(scene);

    const heightMaps = await loadHeightMaps(scene, progressMonitor);

    const earthModel = getEarthModel([]);

    const earthRadius = earthModel.radius; // Average radius of Earth in meters

    // This creates and positions a free camera (non-mesh)
    const controls = new DefaultControls(scene);
    controls.getTransform().position = new Vector3(0, 5, -10).normalize().scale(earthRadius * 3);
    controls.getTransform().lookAt(Vector3.Zero());
    controls.speed = earthRadius / 3;

    const camera = controls.getActiveCamera();
    camera.minZ = 0.01;
    camera.maxZ = 0.0;

    // This attaches the camera to the canvas
    camera.attachControl();

    scene.activeCamera = camera;

    engine.getRenderingCanvas()?.addEventListener("click", async () => {
        await engine.getRenderingCanvas()?.requestPointerLock();
    });

    const depthRenderer = scene.enableDepthRenderer(null, true, true);
    depthRenderer.clearColor.set(0, 0, 0, 1);

    const light = new PointLight("light", new Vector3(10, 2, -10).normalize().scale(earthRadius * 10), scene);
    light.falloffType = Light.FALLOFF_STANDARD;
    light.intensity = 4;

    const gizmo = new LightGizmo();
    gizmo.light = light;

    const gizmoManager = new GizmoManager(scene);
    gizmoManager.positionGizmoEnabled = true;
    gizmoManager.rotationGizmoEnabled = true;
    gizmoManager.boundingBoxGizmoEnabled = true;
    gizmoManager.usePointerToAttachGizmos = false;
    //gizmoManager.attachToMesh(lightGizmo.attachedMesh);

    const useHighQuality = new URLSearchParams(window.location.search).get("light") === null;

    let albedoBslTexture: Texture2dUv;
    let normalBslTexture: Texture2dUv;

    if (useHighQuality) {
        const albedoResult = await loadEarthHighResolutionAlbedo(scene, engine, progressMonitor);
        if (!albedoResult.success) {
            throw new Error(`Failed to create albedo texture array: ${String(albedoResult.error)}`);
        }

        const normalMapResult = await loadEarthHighResolutionNormal(scene, engine, progressMonitor);
        if (!normalMapResult.success) {
            throw new Error(`Failed to create normal map texture array: ${String(normalMapResult.error)}`);
        }

        albedoBslTexture = albedoResult.value;
        normalBslTexture = normalMapResult.value;
    } else {
        albedoBslTexture = {
            type: "texture_2d",
            texture: await loadEarthAlbedo(scene, progressMonitor),
        };

        normalBslTexture = {
            type: "texture_2d",
            texture: await loadEarthNormal(scene, progressMonitor),
        };
    }

    const material = new CustomPlanetMaterial(albedoBslTexture, normalBslTexture, scene);

    const terrainModel: TerrainModel = {
        type: "custom",
        heightRange: {
            min: -11e3,
            max: 8.6e3,
        },
        id: "earth",
    };

    const terrain = new SphericalHeightFieldTerrain(
        "SphericalHeightFieldTerrain",
        earthRadius,
        terrainModel,
        material.get(),
        scene,
    );

    const heightMapAtlas = new PlanetHeightMapAtlas(heightMaps, scene);

    if (useHighQuality) {
        await heightMapAtlas.loadHeightMapsToGpu([terrainModel.id], progressMonitor);
    }

    const chunkForgeResult = await ChunkForgeCompute.New(6, 64, heightMapAtlas, engine);
    if (!chunkForgeResult.success) {
        throw new Error(`Failed to create chunk forge: ${String(chunkForgeResult.error)}`);
    }

    const chunkForge = chunkForgeResult.value;

    const oceanUniforms = new OceanUniforms(earthRadius, 0);
    const ocean = new OceanPostProcess(
        terrain.getTransform(),
        earthRadius,
        oceanUniforms,
        [light],
        waterTextures,
        scene,
    );
    camera.attachPostProcess(ocean);

    const cloudsUniforms = new CloudsUniforms(earthModel.clouds, texturePools.cloudsLut, scene);
    const cloudsPostProcess = new FlatCloudsPostProcess(
        terrain.getTransform(),
        earthRadius,
        cloudsUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(cloudsPostProcess);

    const atmosphereUniforms = new AtmosphereUniforms(earthRadius, earthModel.mass, 298, earthModel.atmosphere);
    const atmospherePostProcess = new AtmosphericScatteringPostProcess(
        terrain.getTransform(),
        earthRadius,
        atmosphereUniforms,
        [light],
        scene,
    );
    camera.attachPostProcess(atmospherePostProcess);

    const iss = (await loadIss(scene, progressMonitor)).instantiateHierarchy();
    if (iss === null) {
        throw new Error("Failed to load ISS model.");
    }

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("iss") !== null) {
        controls.getTransform().parent = iss;
        controls.getTransform().position = new Vector3(100, 0, -100);
        controls.getTransform().lookAt(Vector3.Zero());
        controls.speed = 10;
    }

    const earthOrbitalObject = new CustomOrbitalObject(terrain.getTransform(), {
        id: "earth",
        name: "Earth",
        type: OrbitalObjectType.CUSTOM,
        orbit: {
            parentIds: [],
            semiMajorAxis: 0,
            eccentricity: 0,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            argumentOfPeriapsis: 0,
            initialMeanAnomaly: 0,
            p: 1,
        },
        mass: earthModel.mass, // kg
        siderealDaySeconds: earthModel.siderealDaySeconds, // seconds
        axialTilt: earthModel.axialTilt, // radians
    });

    const issOrbitalObject = new CustomOrbitalObject(iss, {
        id: "iss",
        name: "International Space Station",
        type: OrbitalObjectType.CUSTOM,
        orbit: {
            parentIds: [],
            semiMajorAxis: 6_771_000,
            eccentricity: 0.0001,
            inclination: 51.64 * (Math.PI / 180),
            longitudeOfAscendingNode: 0,
            argumentOfPeriapsis: 0,
            initialMeanAnomaly: 0,
            p: 2,
        },
        mass: 420_000, // kg
        siderealDaySeconds: 0, // ISS does not rotate around its axis
        axialTilt: 0, // ISS does not have an axial tilt
    });

    let elapsedSeconds = 0;
    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;
        elapsedSeconds += deltaSeconds;

        controls.update(deltaSeconds);

        terrain.update(camera, chunkForge);
        chunkForge.update();

        ocean.update(deltaSeconds);

        const issPosition = getOrbitalPosition(
            issOrbitalObject,
            [earthOrbitalObject],
            Matrix.Identity(),
            elapsedSeconds,
        );
        const dt = 10; // seconds
        const issFuturePosition = getOrbitalPosition(
            issOrbitalObject,
            [earthOrbitalObject],
            Matrix.Identity(),
            elapsedSeconds + dt,
        );
        const vApprox = issFuturePosition.subtract(issPosition).scaleInPlace(1 / dt); // simple finite‑difference velocity
        const nadir = terrain.getTransform().position.subtract(issPosition).normalize();
        iss.rotationQuaternion = issQuaternion(nadir, vApprox);
        iss.position = issPosition;

        controls.getTransform().computeWorldMatrix(true);
        camera.getViewMatrix(true);

        const cameraPosition = camera.globalPosition.clone();
        const rootNodes = getAllRootTransformNodes(scene);
        for (const rootNode of rootNodes) {
            rootNode.position.subtractInPlace(cameraPosition);
            rootNode.computeWorldMatrix(true);
        }

        material.setPlanetInverseWorld(terrain.getTransform().computeWorldMatrix(true).clone().invert());
    });

    await new Promise<void>((resolve) => {
        const observer = engine.onBeginFrameObservable.add(() => {
            terrain.update(camera, chunkForge);
            chunkForge.update();

            if (terrain.isIdle()) {
                observer.remove();
                resolve();
            }
        });
    });

    return scene;
}
