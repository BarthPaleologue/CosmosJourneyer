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
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import earcut from "earcut";

import { err, ok, type Result } from "@/utils/types";

import type { RenderingAssets } from "../assets/renderingAssets";
import { bevelPolygon } from "../helpers/bevel";
import { createEdgeTubeFrame } from "../helpers/meshFrame";
import { createPanelsFromFrame } from "../helpers/panelsFromFrame";
import { sheerAlongY } from "../helpers/sheer";
import type { Vehicle } from "./vehicle";
import { VehicleBuilder } from "./vehicleBuilder";
import { WireframeTopology } from "./wireframeTopology";

export function createWolfMk2(
    assets: RenderingAssets,
    scene: Scene,
    spawnPosition: Vector3,
    spawnRotation: {
        axis: Vector3;
        angle: number;
    },
): Result<Vehicle, string> {
    const frameMat = new PBRMaterial("frame", scene);
    frameMat.metallic = 0;
    frameMat.roughness = 0.5;
    frameMat.albedoColor.set(0.9, 0.9, 0.9);
    frameMat.specularIntensity = 0.5;

    const frameHalfWidth = 1.2;

    const frameLength = 6.0;

    const frameHeight = 2.0;

    const heightOfMaxWidth = frameHeight * 0.7;
    const maxHalfWidth = frameHalfWidth * 1.4;

    const topHalfWidth = frameHalfWidth * 0.8;

    const frameThickness = 0.02;

    const sectionHarsh = [
        new Vector3(-frameHalfWidth, 0, 0),
        new Vector3(frameHalfWidth, 0, 0),
        new Vector3(maxHalfWidth, 0, heightOfMaxWidth),
        new Vector3(topHalfWidth, 0, frameHeight),
        new Vector3(-topHalfWidth, 0, frameHeight),
        new Vector3(-maxHalfWidth, 0, heightOfMaxWidth),
    ];

    const section = bevelPolygon(sectionHarsh, 10, 0.05);

    const sectionBarycenter = section.reduce((acc, v) => acc.addInPlace(v), Vector3.Zero()).scale(1 / section.length);

    const sectionHole = section.map((v) => {
        const holeVertex = v.subtract(sectionBarycenter);
        const distanceFromCenter = holeVertex.length();
        holeVertex.scaleInPlace((distanceFromCenter - frameThickness) / distanceFromCenter);
        return holeVertex.addInPlace(sectionBarycenter);
    });

    const frame = MeshBuilder.ExtrudePolygon(
        "backDoor",
        { shape: section, holes: [sectionHole], depth: frameLength },
        scene,
        earcut,
    );
    frame.material = frameMat;

    const frameSheerAmount = 0.8;
    const sheerAngle = Math.atan2(frameSheerAmount, frameHeight);
    const sheerScaling = Math.hypot(frameHeight, frameSheerAmount) / frameHeight;

    sheerAlongY(frame, frameSheerAmount);
    frame.rotate(Axis.X, -Math.PI / 2);
    frame.position.z = -frameLength / 2;
    frame.bakeCurrentTransformIntoVertices();
    frame.position.y = 0.5;

    const backDoorThickness = frameThickness;
    const backDoor = MeshBuilder.ExtrudePolygon(
        "backDoor",
        { shape: section, depth: backDoorThickness },
        scene,
        earcut,
    );
    backDoor.scaling.z = sheerScaling;
    backDoor.rotate(Axis.X, -Math.PI / 2 - sheerAngle);
    backDoor.material = frameMat;

    const roofSolarPanelZOffset = -frameSheerAmount;

    const roofSolarPanelRotationAngle = Math.atan2(frameHeight - heightOfMaxWidth, topHalfWidth - maxHalfWidth);
    const roofSolarPanel1 = MeshBuilder.CreateBox(
        "RoofSolarPanel1",
        {
            height: 0.05,
            width: frameHalfWidth - 0.2,
            depth: frameLength * 0.8,
        },
        scene,
    );
    roofSolarPanel1.rotate(Axis.Z, roofSolarPanelRotationAngle);
    roofSolarPanel1.material = assets.materials.solarPanel;

    const roofSolarPanel2 = MeshBuilder.CreateBox(
        "RoofSolarPanel2",
        {
            height: 0.05,
            width: frameHalfWidth - 0.2,
            depth: frameLength * 0.8,
        },
        scene,
    );
    roofSolarPanel2.material = assets.materials.solarPanel;
    roofSolarPanel2.rotate(Axis.Z, -roofSolarPanelRotationAngle);

    const roofSolarPanel3 = MeshBuilder.CreateBox(
        "RoofSolarPanel3",
        {
            height: 0.05,
            width: frameHalfWidth * 1.2,
            depth: frameLength * 0.8,
        },
        scene,
    );
    roofSolarPanel3.material = assets.materials.solarPanel;

    const canopyHeight = frameHeight;

    const canopyTopology = new WireframeTopology();
    const bottomLeft = canopyTopology.addVertex(-frameHalfWidth, 0, 0);
    const bottomRight = canopyTopology.addVertex(frameHalfWidth, 0, 0);

    const middleOverhang = 0.7;
    const middleHeight = canopyHeight * 0.2;
    const middleHalfWidth = (frameHalfWidth + maxHalfWidth) / 2;

    const middleLeft = canopyTopology.addVertex(-middleHalfWidth, middleHeight, middleOverhang);
    const middleRight = canopyTopology.addVertex(middleHalfWidth, middleHeight, middleOverhang);
    const centerLeft = canopyTopology.addVertex(-middleHalfWidth * 0.4, middleHeight, middleOverhang);
    const centerRight = canopyTopology.addVertex(middleHalfWidth * 0.4, middleHeight, middleOverhang);

    const frontOverhang = middleOverhang + 0.3;
    const frontHalfWidth = middleHalfWidth * 0.7;
    const frontHeight = middleHeight + 0.9;

    const frontLeft = canopyTopology.addVertex(-frontHalfWidth, frontHeight, frontOverhang);
    const frontRight = canopyTopology.addVertex(frontHalfWidth, frontHeight, frontOverhang);

    const topOverhang = 0.0;
    const topHeight = canopyHeight;

    const heightFractionOfTop = heightOfMaxWidth / frameHeight;

    const topLeft = canopyTopology.addVertex(
        -maxHalfWidth,
        heightOfMaxWidth,
        topOverhang - frameSheerAmount * heightFractionOfTop,
    );
    const topMidLeft = canopyTopology.addVertex(-topHalfWidth, topHeight, topOverhang - frameSheerAmount);
    const topMidRight = canopyTopology.addVertex(topHalfWidth, topHeight, topOverhang - frameSheerAmount);
    const topRight = canopyTopology.addVertex(
        maxHalfWidth,
        heightOfMaxWidth,
        topOverhang - frameSheerAmount * heightFractionOfTop,
    );

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

    canopyTopology.connect(bottomLeft, topLeft);
    canopyTopology.connect(bottomRight, topRight);

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

    const canopyFrame = createEdgeTubeFrame("canopyFrame", positionsResult.value, edgesResult.value, 0.03, scene);
    if (canopyFrame === null) {
        return err("Failed to create canopy frame");
    }

    canopyFrame.material = frameMat;

    const glassPanels = createPanelsFromFrame("canopyPanels", positionsResult.value, edgesResult.value, 0.01, scene);
    if (glassPanels !== null) {
        glassPanels.parent = canopyFrame;
        glassPanels.material = assets.materials.glass;
    }

    //const canopyFrameMaterial = new CanopyFrameMaterial(textures.canopyFrame, scene);
    //canopyFrame.material = canopyFrameMaterial.get();

    const wheelDistanceFromCenter = frameHalfWidth + 1.0;

    const wheelSpread = 0.4;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, frameLength * wheelSpread);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, frameLength * wheelSpread);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -frameLength * wheelSpread);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -frameLength * wheelSpread);

    const vehicleBuilder = new VehicleBuilder(frame, assets, scene);

    const wheelRadius = 0.7;
    const wheelThickness = 0.8;

    const vehicle = vehicleBuilder
        .addWheel(forwardLeftWheelPosition, wheelRadius, wheelThickness, true, true)
        .addWheel(forwardRightWheelPosition, wheelRadius, wheelThickness, true, true)
        .addWheel(middleLeftWheelPosition, wheelRadius, wheelThickness, false, false)
        .addWheel(middleRightWheelPosition, wheelRadius, wheelThickness, false, false)
        .addWheel(rearLeftWheelPosition, wheelRadius, wheelThickness, true, true)
        .addWheel(rearRightWheelPosition, wheelRadius, wheelThickness, true, true)
        .addPart(
            roofSolarPanel1,
            new Vector3((topHalfWidth + maxHalfWidth) / 2, (heightOfMaxWidth + frameHeight) / 2, roofSolarPanelZOffset),
            100,
            { type: "fixed", rotation: { z: -roofSolarPanelRotationAngle } },
        )
        .addPart(
            roofSolarPanel2,
            new Vector3(
                -(topHalfWidth + maxHalfWidth) / 2,
                (heightOfMaxWidth + frameHeight) / 2,
                roofSolarPanelZOffset,
            ),
            100,
            { type: "fixed", rotation: { z: roofSolarPanelRotationAngle } },
        )
        .addPart(roofSolarPanel3, new Vector3(0, frameHeight + 0.02, roofSolarPanelZOffset), 100, { type: "fixed" })
        .addPart(canopyFrame, new Vector3(0, 0, frameLength / 2), 100, { type: "fixed" })
        .addPart(backDoor, new Vector3(0, 0, -frameLength / 2 - backDoorThickness), 100, {
            type: "hinge",
            axis: "x",
            range: {
                min: (2 * Math.PI) / 3,
                max: (3 * Math.PI) / 2 - sheerAngle,
            },
        })
        .translateSpawn(spawnPosition)
        .rotateSpawn(spawnRotation.axis, spawnRotation.angle)
        .assemble();

    return ok(vehicle);
}
