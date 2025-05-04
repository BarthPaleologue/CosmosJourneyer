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
import { DefaultControls } from "../defaultControls/defaultControls";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { CustomOrbitalObject } from "../utils/customOrbitalObject";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Tools } from "@babylonjs/core/Misc/tools";
import { OrbitRenderer } from "../orbit/orbitRenderer";
import { AxisRenderer } from "../orbit/axisRenderer";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { OrbitalObjectUtils } from "../architecture/orbitalObjectUtils";

export async function createOrbitalDemoScene(
    engine: AbstractEngine,
    progressCallback: (progress: number, text: string) => void
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
            p: 2
        },
        type: OrbitalObjectType.CUSTOM,
        axialTilt: 0,
        mass: 1e12,
        siderealDaySeconds: 0
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
            p: 2
        },
        type: OrbitalObjectType.CUSTOM,
        axialTilt: Tools.ToRadians(23.5),
        mass: 1e11,
        siderealDaySeconds: 0
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
            p: 2
        },
        type: OrbitalObjectType.CUSTOM,
        mass: 1e10,
        axialTilt: 0,
        siderealDaySeconds: 0
    });

    const bodies = [sun, earth, moon];

    const bodyToParents = new Map<OrbitalObject, OrbitalObject[]>();
    bodyToParents.set(earth, [sun]);
    bodyToParents.set(moon, [earth]);

    const orbitRenderer = new OrbitRenderer();
    orbitRenderer.setOrbitalObjects(bodies, scene);
    orbitRenderer.setVisibility(true);

    const axisRenderer = new AxisRenderer();
    axisRenderer.setVisibility(true);
    axisRenderer.setOrbitalObjects(bodies, scene);

    const referencePlaneRotation = Matrix.Identity();
    const referencePlaneDeltaRotation = Matrix.Identity();

    let elapsedSeconds = 0;

    defaultControls.getTransform().setAbsolutePosition(new Vector3(0, 0, -10));
    defaultControls.getTransform().lookAt(Vector3.Zero());

    scene.onBeforeRenderObservable.add(() => {
        const deltaSeconds = engine.getDeltaTime() / 1000;

        elapsedSeconds += deltaSeconds;
        defaultControls.update(deltaSeconds);

        Matrix.FromQuaternionToRef(
            defaultControls.getTransform().rotationQuaternion?.clone().invertInPlace() ?? Quaternion.Identity(),
            referencePlaneDeltaRotation
        );
        defaultControls.getTransform().rotationQuaternion = Quaternion.Identity();
        defaultControls.getTransform().computeWorldMatrix(true);
        referencePlaneRotation.multiplyToRef(referencePlaneDeltaRotation, referencePlaneRotation);

        bodies.forEach((body) => {
            OrbitalObjectUtils.SetOrbitalPosition(
                body,
                bodyToParents.get(body) ?? [],
                referencePlaneRotation,
                elapsedSeconds
            );
            OrbitalObjectUtils.SetRotation(body, referencePlaneRotation, elapsedSeconds);
        });

        orbitRenderer.update(referencePlaneRotation);
    });

    progressCallback(1, "Loading complete");

    return scene;
}
