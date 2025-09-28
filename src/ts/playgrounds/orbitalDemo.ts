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
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Scene } from "@babylonjs/core/scene";

import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { type ILoadingProgressMonitor } from "@/frontend/assets/loadingProgressMonitor";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { lookAt } from "@/frontend/helpers/transform";
import { type OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";
import { setOrbitalPosition, setRotation } from "@/frontend/universe/architecture/orbitalObjectUtils";
import { AxisRenderer } from "@/frontend/universe/axisRenderer";
import { CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";
import { CreateGreasedLineHelper } from "@/frontend/universe/lineRendering";
import { OrbitRenderer } from "@/frontend/universe/orbitRenderer";

export function createOrbitalDemoScene(
    engine: AbstractEngine,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    progressMonitor: ILoadingProgressMonitor | null,
): Promise<Scene> {
    const scene = new Scene(engine);
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
            argumentOfPeriapsis: 0,
            semiMajorAxis: 0,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 0,
            inclination: 0,
            eccentricity: 0,
            p: 2,
        },
        type: OrbitalObjectType.CUSTOM,
        axialTilt: 0,
        mass: 1e12,
        siderealDaySeconds: 0,
    });

    const earth = new CustomOrbitalObject(MeshBuilder.CreateSphere("earth", { diameter: 0.5 }, scene), {
        id: "earth",
        name: "Earth",
        orbit: {
            parentIds: [sun.model.id],
            argumentOfPeriapsis: 0,
            semiMajorAxis: 10,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 1.7,
            inclination: Tools.ToRadians(23.5),
            eccentricity: 0.5,
            p: 2,
        },
        type: OrbitalObjectType.CUSTOM,
        axialTilt: Tools.ToRadians(23.5),
        mass: 1e11,
        siderealDaySeconds: 0,
    });

    const moon = new CustomOrbitalObject(MeshBuilder.CreateSphere("moon", { diameter: 0.2 }, scene), {
        id: "moon",
        name: "Moon",
        orbit: {
            parentIds: [earth.model.id],
            argumentOfPeriapsis: 0,
            semiMajorAxis: 3,
            initialMeanAnomaly: 0,
            longitudeOfAscendingNode: 0,
            inclination: earth.model.orbit.inclination + earth.model.axialTilt, //Tools.ToRadians(45),
            eccentricity: 0.7,
            p: 2,
        },
        type: OrbitalObjectType.CUSTOM,
        mass: 1e10,
        axialTilt: 0,
        siderealDaySeconds: 0,
    });

    const bodies = [sun, earth, moon];

    const bodyToParents = new Map<OrbitalObject, OrbitalObject[]>();
    bodyToParents.set(earth, [sun]);
    bodyToParents.set(moon, [earth]);

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

        bodies.forEach((body) => {
            setOrbitalPosition(body, bodyToParents.get(body) ?? [], referencePlaneRotation, elapsedSeconds);
            setRotation(body, referencePlaneRotation, elapsedSeconds);
        });

        orbitRenderer.update(referencePlaneRotation);
    });

    return Promise.resolve(scene);
}
