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

import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import type { TireTextures } from "../assets/textures/materials/tire";
import { createPanelsFromFrame } from "../helpers/panelsFromFrame";
import { TireMaterial } from "./tireMaterial";
import type { Vehicle } from "./vehicle";
import { FilterMeshCollisions, VehicleBuilder } from "./vehicleBuilder";

export function createWolfMk2(tireTextures: TireTextures, scene: Scene): Vehicle {
    const frameMat = new PBRMaterial("frame", scene);
    frameMat.metallic = 0;
    frameMat.roughness = 1.0;

    const roverHalfWidth = 1.5;

    const carFrame = MeshBuilder.CreateBox("Frame", { height: 0.2, width: roverHalfWidth * 2, depth: 9 });
    carFrame.material = frameMat;
    carFrame.position = new Vector3(0, 0.8, 0);
    const carAggregate = new PhysicsAggregate(carFrame, PhysicsShapeType.MESH, {
        mass: 2000,
        restitution: 0,
        friction: 0,
        center: new Vector3(0, -2.5, 0),
    });
    FilterMeshCollisions(carAggregate.shape);

    const canopyHeight = 2.0;

    // Faceted canopy vertices (Vector3[])
    const positions = new Float32Array([
        // top left
        -roverHalfWidth,
        canopyHeight,
        0.2,
        // top right
        roverHalfWidth,
        canopyHeight,
        0.2,
        // middle left
        -roverHalfWidth - 0.3,
        canopyHeight / 2,
        0.0,
        // middle right
        roverHalfWidth + 0.3,
        canopyHeight / 2,
        0.0,
        // bottom left
        -roverHalfWidth,
        0,
        0,
        // bottom right
        roverHalfWidth,
        0,
        0,
        // center left
        -roverHalfWidth * 0.5,
        canopyHeight * 0.5,
        0.6,
        // center right
        roverHalfWidth * 0.5,
        canopyHeight * 0.5,
        0.6,
    ]);

    // Flatten to typed arrays
    const edges = new Uint32Array([
        5, 3, 3, 1, 3, 7, 0, 2, 2, 6, 6, 0, 2, 4, 4, 6, 6, 2, 1, 7, 3, 3, 7, 5, 7, 6, 1, 0, 4, 5, 6, 7,
    ]);

    const glass = new PBRMaterial("glass", scene);
    glass.reflectivityColor = new Color3(0.2, 0.2, 0.2);
    glass.albedoColor = new Color3(0.95, 0.95, 0.95);
    glass.metallic = 0;
    glass.roughness = 0.05;
    glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    glass.alpha = 0.25;
    glass.indexOfRefraction = 1.5;
    glass.backFaceCulling = false;

    const canopyFrame = createEdgeTubeFrame("canopyFrame", positions, edges, 0.05, scene);
    if (canopyFrame !== null) {
        canopyFrame.position = new Vector3(0, 0, 4.5);
        canopyFrame.parent = carFrame;
        canopyFrame.material = frameMat;

        const glassPanels = createPanelsFromFrame("canopyPanels", positions, edges, 0.02, scene);
        if (glassPanels !== null) {
            glassPanels.parent = canopyFrame;
            glassPanels.material = glass;
        }
    }

    const wheelDistanceFromCenter = 2.5;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 3);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 3);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -3);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -3);

    const vehicleBuilder = new VehicleBuilder({
        mesh: carFrame,
        physicsBody: carAggregate.body,
        physicsShape: carAggregate.shape,
    });

    const wheelRadius = 0.7;

    vehicleBuilder.addWheel(forwardLeftWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(forwardRightWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(middleLeftWheelPosition, wheelRadius, true, false);
    vehicleBuilder.addWheel(middleRightWheelPosition, wheelRadius, true, false);
    vehicleBuilder.addWheel(rearLeftWheelPosition, wheelRadius, true, true);
    vehicleBuilder.addWheel(rearRightWheelPosition, wheelRadius, true, true);

    const tireMaterial = new TireMaterial(tireTextures, scene);

    return vehicleBuilder.build({ tireMaterial: tireMaterial.get() }, scene);
}

function createEdgeTubeFrame(name: string, positions: Float32Array, edges: Uint32Array, radius: number, scene: Scene) {
    const edgeKey = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    const seen = new Set<string>();
    const tubes: Array<Mesh> = [];
    const tessellation = 12;
    const overlap = 0;

    const getVec = (i: number) => new Vector3(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2]);

    const usedVerts = new Set<number>();

    for (let i = 0; i < edges.length; i += 2) {
        const a = edges[i];
        const b = edges[i + 1];
        if (a === undefined || b === undefined) continue;

        const k = edgeKey(a, b);
        if (seen.has(k)) continue;
        seen.add(k);

        usedVerts.add(a);
        usedVerts.add(b);

        const p1 = getVec(a);
        const p2 = getVec(b);
        const dir = p2.subtract(p1).normalize();

        const q1 = p1.subtract(dir.scale(overlap));
        const q2 = p2.add(dir.scale(overlap));

        const tube = MeshBuilder.CreateTube(
            `e_${k}`,
            { path: [q1, q2], radius, tessellation, updatable: false },
            scene,
        );
        tubes.push(tube);
    }

    for (const vi of usedVerts) {
        const x = positions[3 * vi];
        const y = positions[3 * vi + 1];
        const z = positions[3 * vi + 2];
        if (x === undefined || y === undefined || z === undefined) continue;
        const joint = MeshBuilder.CreateSphere(`j_${vi}`, { diameter: radius * 2, segments: 12 }, scene);
        joint.position.set(x, y, z);
        tubes.push(joint);
    }

    const merged = Mesh.MergeMeshes(tubes, true, true, undefined, false, true);
    if (!merged) return null;
    merged.name = name;
    return merged;
}
