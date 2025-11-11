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
import {
    PhysicsConstraintAxis,
    PhysicsConstraintMotorType,
    PhysicsShapeType,
} from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Physics6DoFConstraint } from "@babylonjs/core/Physics/v2/physicsConstraint";
import type { Scene } from "@babylonjs/core/scene";
import earcut from "earcut";

import { ok, type Result } from "@/utils/types";

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

    const roverHalfWidth = 1.2;

    const roverLength = 6.0;

    const roverHeight = 2.0;

    const heightOfMaxWidth = roverHeight * 0.7;
    const maxHalfWidth = roverHalfWidth * 1.4;

    const topHalfWidth = roverHalfWidth * 0.8;

    const wallThickness = 0.02;

    const sectionHarsh = [
        new Vector3(-roverHalfWidth, 0, 0),
        new Vector3(roverHalfWidth, 0, 0),
        new Vector3(maxHalfWidth, 0, heightOfMaxWidth),
        new Vector3(topHalfWidth, 0, roverHeight),
        new Vector3(-topHalfWidth, 0, roverHeight),
        new Vector3(-maxHalfWidth, 0, heightOfMaxWidth),
    ];

    const section = bevelPolygon(sectionHarsh, 10, 0.05);

    const sectionBarycenter = section.reduce((acc, v) => acc.addInPlace(v), Vector3.Zero()).scale(1 / section.length);

    const sectionHole = section.map((v) => {
        const holeVertex = v.subtract(sectionBarycenter);
        const distanceFromCenter = holeVertex.length();
        holeVertex.scaleInPlace((distanceFromCenter - wallThickness) / distanceFromCenter);
        return holeVertex.addInPlace(sectionBarycenter);
    });

    const frame = MeshBuilder.ExtrudePolygon(
        "backDoor",
        { shape: section, holes: [sectionHole], depth: roverLength },
        scene,
        earcut,
    );
    frame.material = frameMat;

    const frameSheerAmount = 0.8;
    const sheerAngle = Math.atan2(frameSheerAmount, roverHeight);
    const sheerScaling = Math.hypot(roverHeight, frameSheerAmount) / roverHeight;

    sheerAlongY(frame, frameSheerAmount);
    frame.rotate(Axis.X, -Math.PI / 2);
    frame.position.z = -roverLength / 2;
    frame.bakeCurrentTransformIntoVertices();
    frame.position.y = 0.5;

    const backDoorThickness = wallThickness;
    const backDoor = MeshBuilder.ExtrudePolygon(
        "backDoor",
        { shape: section, depth: backDoorThickness },
        scene,
        earcut,
    );
    backDoor.scaling.z = sheerScaling;
    backDoor.rotate(Axis.X, -Math.PI / 2 - sheerAngle);
    backDoor.parent = frame;
    backDoor.position = new Vector3(0, 0, -roverLength / 2 - backDoorThickness);
    backDoor.material = frameMat;

    const roofSolarPanelZOffset = -frameSheerAmount;

    const roofSolarPanelRotationAngle = Math.atan2(roverHeight - heightOfMaxWidth, topHalfWidth - maxHalfWidth);
    const roofSolarPanel1 = MeshBuilder.CreateBox(
        "RoofSolarPanel1",
        {
            height: 0.05,
            width: roverHalfWidth - 0.2,
            depth: roverLength * 0.8,
        },
        scene,
    );
    roofSolarPanel1.material = assets.materials.solarPanel;
    roofSolarPanel1.rotate(Axis.Z, roofSolarPanelRotationAngle);
    roofSolarPanel1.position = new Vector3(
        (topHalfWidth + maxHalfWidth) / 2,
        (heightOfMaxWidth + roverHeight) / 2,
        roofSolarPanelZOffset,
    );
    roofSolarPanel1.parent = frame;

    const roofSolarPanel2 = MeshBuilder.CreateBox(
        "RoofSolarPanel2",
        {
            height: 0.05,
            width: roverHalfWidth - 0.2,
            depth: roverLength * 0.8,
        },
        scene,
    );
    roofSolarPanel2.material = assets.materials.solarPanel;
    roofSolarPanel2.rotate(Axis.Z, -roofSolarPanelRotationAngle);
    roofSolarPanel2.position = new Vector3(
        -(topHalfWidth + maxHalfWidth) / 2,
        (heightOfMaxWidth + roverHeight) / 2,
        roofSolarPanelZOffset,
    );
    roofSolarPanel2.parent = frame;

    const roofSolarPanel3 = MeshBuilder.CreateBox(
        "RoofSolarPanel3",
        {
            height: 0.05,
            width: roverHalfWidth * 1.2,
            depth: roverLength * 0.8,
        },
        scene,
    );
    roofSolarPanel3.material = assets.materials.solarPanel;
    roofSolarPanel3.position = new Vector3(0, roverHeight + 0.02, roofSolarPanelZOffset);
    roofSolarPanel3.parent = frame;

    const canopyHeight = roverHeight;

    const canopyTopology = new WireframeTopology();
    const bottomLeft = canopyTopology.addVertex(-roverHalfWidth, 0, 0);
    const bottomRight = canopyTopology.addVertex(roverHalfWidth, 0, 0);

    const middleOverhang = 0.7;
    const middleHeight = canopyHeight * 0.2;
    const middleHalfWidth = (roverHalfWidth + maxHalfWidth) / 2;

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

    const heightFractionOfTop = heightOfMaxWidth / roverHeight;

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
    if (canopyFrame !== null) {
        canopyFrame.position = new Vector3(0, 0, roverLength / 2);
        canopyFrame.parent = frame;
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
            glassPanels.material = assets.materials.glass;
        }

        //const canopyFrameMaterial = new CanopyFrameMaterial(textures.canopyFrame, scene);
        //canopyFrame.material = canopyFrameMaterial.get();
    }

    const wheelDistanceFromCenter = roverHalfWidth + 1.0;

    const wheelSpread = 0.4;

    const forwardLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, roverLength * wheelSpread);
    const forwardRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, roverLength * wheelSpread);
    const middleLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, 0);
    const middleRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, 0);
    const rearLeftWheelPosition = new Vector3(wheelDistanceFromCenter, 0, -roverLength * wheelSpread);
    const rearRightWheelPosition = new Vector3(-wheelDistanceFromCenter, 0, -roverLength * wheelSpread);

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
        .translateSpawn(spawnPosition)
        .rotateSpawn(spawnRotation.axis, spawnRotation.angle)
        .assemble();

    backDoor.setParent(null);

    const backDoorMass = 100;
    const backDoorAggregate = new PhysicsAggregate(
        backDoor,
        PhysicsShapeType.CONVEX_HULL,
        { mass: backDoorMass },
        scene,
    );

    // Math.PI is corresponds to horizontal angle, toward the rear of the vehicle
    const hingeLowerAngle = (2 * Math.PI) / 3;
    const hingeUpperAngle = (3 * Math.PI) / 2 - sheerAngle;

    const motorizedHinge = new Physics6DoFConstraint(
        {
            pivotA: new Vector3(0, 0, -roverLength / 2),
            pivotB: Vector3.Zero(),
        },
        [
            {
                axis: PhysicsConstraintAxis.LINEAR_Y,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.LINEAR_X,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_X,
                minLimit: hingeLowerAngle,
                maxLimit: hingeUpperAngle,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Y,
                minLimit: 0,
                maxLimit: 0,
            },
            {
                axis: PhysicsConstraintAxis.ANGULAR_Z,
                minLimit: 0,
                maxLimit: 0,
            },
        ],
        scene,
    );

    frame.physicsBody?.addConstraint(backDoorAggregate.body, motorizedHinge);

    motorizedHinge.setAxisMotorType(PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
    motorizedHinge.setAxisMotorTarget(PhysicsConstraintAxis.ANGULAR_X, 1.0);
    motorizedHinge.setAxisMotorMaxForce(PhysicsConstraintAxis.ANGULAR_X, 100 * backDoorMass);

    return ok(vehicle);
}
