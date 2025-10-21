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
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import type { TireTextures } from "../assets/textures/materials/tire";
import { createMeshFrame } from "../helpers/meshFrame";
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
    const indices = new Uint32Array([0, 2, 6, 2, 4, 6, 1, 7, 3, 3, 7, 5, 7, 6, 1, 6, 1, 0, 4, 5, 6, 5, 6, 7]);

    const glass = new PBRMaterial("glass", scene);
    glass.reflectivityColor = new Color3(0.2, 0.2, 0.2);
    glass.albedoColor = new Color3(0.95, 0.95, 0.95);
    glass.metallic = 0;
    glass.roughness = 0.05;
    glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    glass.alpha = 0.25;
    glass.indexOfRefraction = 1.5;
    glass.backFaceCulling = false;

    const canopy = new Mesh("canopyGlass", scene);
    const vd = new VertexData();
    vd.positions = positions;
    vd.indices = indices;
    vd.normals = [];
    VertexData.ComputeNormals(vd.positions, vd.indices, vd.normals);
    vd.applyToMesh(canopy);
    canopy.parent = carFrame;
    canopy.position = new Vector3(0, 0, 4.5);
    canopy.material = glass;

    const canopyFrame = createMeshFrame(
        "canopyFrame",
        positions,
        indices,
        0.05,
        [
            [6, 1],
            [5, 6],
        ],
        scene,
    );
    if (canopyFrame !== null) {
        canopyFrame.parent = canopy;
        canopyFrame.material = frameMat;
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
