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

import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Scene } from "@babylonjs/core/scene";
import { kilograms, meters, radians, seconds } from "@cosmos-journeyer/physics";

import type { ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { toKeplerian } from "@/frontend/helpers/orbitalObject";
import { lookAt } from "@/frontend/helpers/transform";
import { AxisRenderer } from "@/frontend/universe/axisRenderer";
import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";
import { KeplerianOrbitalSimulation } from "@/frontend/universe/keplerianOrbitalSimulation";
import { CreateGreasedLineHelper } from "@/frontend/universe/lineRendering";
import { OrbitRenderer } from "@/frontend/universe/orbitRenderer";

/**
 * @param engine - Rendering engine.
 * @param progressMonitor - Asset-loading progress.
 * @returns Scene for inspecting orbital motion.
 */
export async function createOrbitalDemoScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor,
): Promise<Scene> {
    const scene = new Scene(engine, { useFloatingOrigin: true });
    scene.useRightHandedSystem = true;

    const defaultControls = new DefaultControls(scene);

    const camera = defaultControls.getActiveCamera();
    camera.minZ = 0.1;
    camera.attachControl();

    const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
    hemi.intensity = 1.0;

    const sun = new CustomOrbitalObject(MeshBuilder.CreateSphere("sun", { diameter: 1 }, scene), {
        id: "sun",
        name: "Sun",
        orbit: {
            parentIds: [],
            argumentOfPeriapsis: radians(0),
            semiMajorAxis: meters(0),
            initialMeanAnomaly: radians(0),
            plane: {
                inclination: radians(0),
                longitudeOfAscendingNode: radians(0),
            },
            eccentricity: 0,
            p: 2,
        },
        type: "custom",
        spin: {
            siderealPeriod: seconds(0),
            axialTilt: radians(0),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
        },
        mass: kilograms(1e12),
    });

    const earth = new CustomOrbitalObject(MeshBuilder.CreateSphere("earth", { diameter: 0.5 }, scene), {
        id: "earth",
        name: "Earth",
        orbit: {
            parentIds: [sun.model.id],
            argumentOfPeriapsis: radians(0),
            semiMajorAxis: meters(10),
            initialMeanAnomaly: radians(0),
            plane: {
                inclination: radians(Tools.ToRadians(23.5)),
                longitudeOfAscendingNode: radians(1.7),
            },
            eccentricity: 0.5,
            p: 2,
        },
        type: "custom",
        spin: {
            siderealPeriod: seconds(0),
            axialTilt: radians(Tools.ToRadians(23.5)),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
        },
        mass: kilograms(1e11),
    });

    const moon = new CustomOrbitalObject(MeshBuilder.CreateSphere("moon", { diameter: 0.2 }, scene), {
        id: "moon",
        name: "Moon",
        orbit: {
            parentIds: [earth.model.id],
            argumentOfPeriapsis: radians(0),
            semiMajorAxis: meters(3),
            initialMeanAnomaly: radians(0),
            plane: {
                inclination: radians(earth.model.orbit.plane.inclination + earth.model.spin.axialTilt),
                longitudeOfAscendingNode: radians(0),
            },
            eccentricity: 0.7,
            p: 2,
        },
        type: "custom",
        mass: kilograms(1e10),
        spin: {
            siderealPeriod: seconds(0),
            axialTilt: radians(0),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
        },
    });

    const bodies = [sun, earth, moon].map(toKeplerian);
    const orbitalSimulation = new KeplerianOrbitalSimulation(bodies);

    const orbitRenderer = new OrbitRenderer(CreateGreasedLineHelper);
    orbitRenderer.setOrbitalObjects(bodies, scene);
    orbitRenderer.setVisibility(true);

    const axisRenderer = new AxisRenderer(CreateGreasedLineHelper);
    axisRenderer.setVisibility(true);
    axisRenderer.setOrbitalObjects(bodies, scene);

    const referencePlaneRotation = Matrix.Identity();

    let elapsedSeconds = 0;

    defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 0, -10));
    lookAt(defaultControls.getTransform(), sun.getTransform().position, scene.useRightHandedSystem);

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        elapsedSeconds += deltaSeconds;
        defaultControls.update(deltaSeconds);

        orbitalSimulation.update(seconds(elapsedSeconds));
        bodies.forEach((body) => {
            const orbitalTransform = orbitalSimulation.getTransform(body.id);
            if (orbitalTransform === undefined) {
                return;
            }
            const transform = body.getTransform();
            transform.position.copyFrom(orbitalTransform.position);
            transform.rotationQuaternion = orbitalTransform.orientation.clone();
            transform.computeWorldMatrix(true);
        });

        orbitRenderer.update(referencePlaneRotation);
        axisRenderer.update();
    });

    return Promise.resolve(scene);
}
