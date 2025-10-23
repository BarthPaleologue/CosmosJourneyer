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
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { Scene } from "@babylonjs/core/scene";

import { ok, type Result } from "@/utils/types";

import type { TireTextures } from "../assets/textures/materials/tire";
import { createEdgeTubeFrame } from "../helpers/meshFrame";
import { createPanelsFromFrame } from "../helpers/panelsFromFrame";
import { TireMaterial } from "./tireMaterial";
import type { Vehicle } from "./vehicle";
import { FilterMeshCollisions, VehicleBuilder } from "./vehicleBuilder";
import { WireframeTopology } from "./wireframeTopology";

export function createWolfMk2(
    tireTextures: TireTextures,
    scene: Scene,
    spawnPosition = Vector3.Zero(),
): Result<Vehicle, string> {
    const frameMat = new PBRMaterial("frame", scene);
    frameMat.metallic = 0;
    frameMat.roughness = 1.0;

    const roverHalfWidth = 1.2;

    const roverLength = 6.0;

    const frameFloor = MeshBuilder.CreateBox("Frame", { height: 0.2, width: roverHalfWidth * 2, depth: roverLength });
    frameFloor.material = frameMat;
    frameFloor.position.copyFrom(spawnPosition);
    const carAggregate = new PhysicsAggregate(frameFloor, PhysicsShapeType.MESH, {
        mass: 2000,
        restitution: 0,
        friction: 0,
        center: new Vector3(0, -2.5, 0),
    });
    FilterMeshCollisions(carAggregate.shape);

    const roverHeight = 2.0;

    const frameRoof = MeshBuilder.CreateBox("FrameRoof", {
        height: 0.2,
        width: roverHalfWidth * 2,
        depth: roverLength,
    });
    frameRoof.material = frameMat;
    frameRoof.position = new Vector3(0, roverHeight, 0);
    frameRoof.parent = frameFloor;

    const frameBackDoor = MeshBuilder.CreateBox("FrameBackDoor", {
        height: roverHeight,
        width: roverHalfWidth * 2,
        depth: 0.2,
    });
    frameBackDoor.material = frameMat;
    frameBackDoor.position = new Vector3(0, roverHeight / 2, -roverLength / 2);
    frameBackDoor.parent = frameFloor;

    const doorWidth = 1.0;

    const frameLeftWall = MeshBuilder.CreateBox("FrameLeftWall", {
        height: roverHeight,
        width: 0.2,
        depth: roverLength - doorWidth,
    });
    frameLeftWall.material = frameMat;
    frameLeftWall.position = new Vector3(roverHalfWidth, roverHeight / 2, -doorWidth / 2);
    frameLeftWall.parent = frameFloor;

    const frameRightWall = MeshBuilder.CreateBox("FrameRightWall", {
        height: roverHeight,
        width: 0.2,
        depth: roverLength,
    });
    frameRightWall.material = frameMat;
    frameRightWall.position = new Vector3(-roverHalfWidth, roverHeight / 2, 0);
    frameRightWall.parent = frameFloor;

    const canopyHeight = roverHeight;

    const canopyTopology = new WireframeTopology();
    const bottomLeft = canopyTopology.addVertex(-roverHalfWidth, 0, 0);
    const bottomRight = canopyTopology.addVertex(roverHalfWidth, 0, 0);

    const middleOverhang = 0.7;
    const middleHeight = canopyHeight * 0.2;
    const middleHalfWidth = roverHalfWidth + 0.4;

    const middleLeft = canopyTopology.addVertex(-middleHalfWidth, middleHeight, middleOverhang);
    const middleRight = canopyTopology.addVertex(middleHalfWidth, middleHeight, middleOverhang);
    const centerLeft = canopyTopology.addVertex(-middleHalfWidth * 0.4, middleHeight, middleOverhang);
    const centerRight = canopyTopology.addVertex(middleHalfWidth * 0.4, middleHeight, middleOverhang);

    const frontOverhang = middleOverhang + 0.3;
    const frontHalfWidth = roverHalfWidth * 0.9;
    const frontHeight = middleHeight + 1.0;

    const frontLeft = canopyTopology.addVertex(-frontHalfWidth, frontHeight, frontOverhang);
    const frontRight = canopyTopology.addVertex(frontHalfWidth, frontHeight, frontOverhang);

    const topOverhang = 0.0;
    const topHeight = canopyHeight;

    const topLeft = canopyTopology.addVertex(-frontHalfWidth - 0.3, topHeight, topOverhang);
    const topMidLeft = canopyTopology.addVertex(-frontHalfWidth * 0.5, topHeight, topOverhang);
    const topMidRight = canopyTopology.addVertex(frontHalfWidth * 0.5, topHeight, topOverhang);
    const topRight = canopyTopology.addVertex(frontHalfWidth + 0.3, topHeight, topOverhang);

    canopyTopology.connect(frontLeft, topLeft);
    canopyTopology.connect(frontLeft, topMidLeft);
    canopyTopology.connect(frontRight, topMidRight);
    canopyTopology.connect(frontRight, topRight);
    canopyTopology.connect(topLeft, topMidLeft);
    canopyTopology.connect(topMidLeft, topMidRight);
    canopyTopology.connect(topMidRight, topRight);

    canopyTopology.connect(topLeft, middleLeft);
    canopyTopology.connect(topRight, middleRight);

    canopyTopology.connect(bottomLeft, middleLeft);
    canopyTopology.connect(bottomRight, middleRight);

    canopyTopology.connect(middleLeft, frontLeft);
    canopyTopology.connect(middleRight, frontRight);

    canopyTopology.connect(centerLeft, bottomLeft);
    canopyTopology.connect(centerRight, bottomRight);

    canopyTopology.connect(frontRight, centerRight);
    canopyTopology.connect(frontLeft, centerLeft);

    canopyTopology.connect(frontLeft, frontRight);
    canopyTopology.connect(bottomLeft, bottomRight);
    canopyTopology.connect(centerLeft, centerRight);

    canopyTopology.connect(middleLeft, centerLeft);
    canopyTopology.connect(middleRight, centerRight);

    const positionsResult = canopyTopology.getPositionsBuffer();
    if (!positionsResult.success) {
        return positionsResult;
    }
    const edgesResult = canopyTopology.getEdgeIndices();
    if (!edgesResult.success) {
        return edgesResult;
    }

    const glass = new PBRMaterial("glass", scene);
    glass.reflectivityColor = new Color3(0.2, 0.2, 0.2);
    glass.albedoColor = new Color3(0.95, 0.95, 0.95);
    glass.metallic = 0;
    glass.roughness = 0.05;
    glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
    glass.alpha = 0.25;
    glass.indexOfRefraction = 1.5;
    glass.backFaceCulling = false;

    const canopyFrame = createEdgeTubeFrame("canopyFrame", positionsResult.value, edgesResult.value, 0.05, scene);
    if (canopyFrame !== null) {
        canopyFrame.position = new Vector3(0, 0, roverLength / 2);
        canopyFrame.parent = frameFloor;
        canopyFrame.material = frameMat;

        const glassPanels = createPanelsFromFrame(
            "canopyPanels",
            positionsResult.value,
            edgesResult.value,
            0.01,
            scene,
        );
        if (glassPanels !== null) {
            glassPanels.parent = canopyFrame;
            glassPanels.material = glass;
        }
    }

    const wheelDistanceFromCenter = roverHalfWidth + 1.0;

    const wheelSpread = 0.4;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, roverLength * wheelSpread);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, roverLength * wheelSpread);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -roverLength * wheelSpread);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -roverLength * wheelSpread);

    const vehicleBuilder = new VehicleBuilder({
        mesh: frameFloor,
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

    return ok(vehicleBuilder.build({ tireMaterial: tireMaterial.get() }, scene));
}
