//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
    Axis,
    Color3,
    CreateCylinder,
    CreateIcoSphere,
    CreateSphere,
    CSG2,
    Matrix,
    PBRMaterial,
    PBRMetallicRoughnessMaterial,
    PointLight,
    Quaternion,
    Vector3,
} from "@babylonjs/core/pure";
import type { Mesh, Scene } from "@babylonjs/core/pure";
import { assertUnreachable, type DeepReadonly } from "@cosmos-journeyer/typescript";

import type { UplinkModel } from "@/backend/persistentEntities/persistentEntityModel";

import { lerpSmooth } from "@/utils/math";

import { createRing } from "../assets/procedural/helpers/ringBuilder";
import type { Transformable } from "../universe/architecture/transformable";

export const UplinkState = {
    IDLE: "idle",
    SCANNING: "scanning",
} as const;
export type UplinkState = (typeof UplinkState)[keyof typeof UplinkState];

export class Uplink implements Transformable {
    readonly lights: Array<PointLight> = [];

    private readonly shell: Mesh;

    private readonly rings: Array<Readonly<{ mesh: Mesh; rotationAxis: Vector3; rotationPeriod: number }>> = [];

    private readonly tempRingRotation = Quaternion.Identity();

    private state: UplinkState = UplinkState.IDLE;

    private ringRotationMask = 0;

    constructor(model: DeepReadonly<UplinkModel>, scene: Scene) {
        const outerRadius = 1e3;
        const shellThickness = 50;
        const entranceInnerRadius = 120;
        const entranceWallThickness = 50;
        const orbRadius = 2.5;
        const entranceExteriorLength = 25;
        const entranceInteriorLength = 25;
        const entranceLength = shellThickness + entranceExteriorLength + entranceInteriorLength;
        const entranceCenter = outerRadius + (entranceExteriorLength - shellThickness - entranceInteriorLength) / 2;
        const shellSubdivisions = 5;

        const outerSphere = CreateIcoSphere(
            `${model.type}OuterSphereSource`,
            { radius: outerRadius, subdivisions: shellSubdivisions, flat: false },
            scene,
        );
        const innerSphere = CreateIcoSphere(
            `${model.type}InnerSphereSource`,
            { radius: outerRadius - shellThickness, subdivisions: shellSubdivisions, flat: false },
            scene,
        );
        const surfaceOrbClearance = 1;

        const entranceTesselation = 6;

        const entranceOuter = CreateCylinder(
            `${model.type}EntranceOuterSource`,
            {
                height: entranceLength,
                diameter: 2 * (entranceInnerRadius + entranceWallThickness),
                tessellation: entranceTesselation,
            },
            scene,
        );
        const entranceInner = CreateCylinder(
            `${model.type}EntranceInnerSource`,
            {
                height: entranceLength + 2 * entranceWallThickness,
                diameter: 2 * entranceInnerRadius,
                tessellation: entranceTesselation,
            },
            scene,
        );

        for (const entrancePart of [entranceOuter, entranceInner]) {
            entrancePart.rotation.x = Math.PI / 2;
            entrancePart.position.z = entranceCenter;
        }

        const sourceMeshes = [outerSphere, innerSphere, entranceOuter, entranceInner];
        const csgs: Array<CSG2> = [];

        const outerSphereCsg = CSG2.FromMesh(outerSphere);
        const innerSphereCsg = CSG2.FromMesh(innerSphere);
        const entranceOuterCsg = CSG2.FromMesh(entranceOuter);
        const entranceInnerCsg = CSG2.FromMesh(entranceInner);
        csgs.push(outerSphereCsg, innerSphereCsg, entranceOuterCsg, entranceInnerCsg);

        const shellCsg = outerSphereCsg.subtract(innerSphereCsg);
        const piercedShellCsg = shellCsg.subtract(entranceInnerCsg);
        const entranceCsg = entranceOuterCsg.subtract(entranceInnerCsg);
        const resultCsg = piercedShellCsg.add(entranceCsg);
        csgs.push(shellCsg, piercedShellCsg, entranceCsg, resultCsg);

        const shellMaterial = new PBRMetallicRoughnessMaterial("uplinkShellMaterial", scene);
        shellMaterial.baseColor = Color3.FromHexString("#050505");
        shellMaterial.roughness = 1;
        shellMaterial.metallic = 0;

        this.shell = resultCsg.toMesh(model.type, scene, { materialToUse: shellMaterial });
        this.shell.convertToFlatShadedMesh();

        this.shell.updateFacetData();
        const uplinkFacetNormals = this.shell.getFacetLocalNormals();
        const surfaceOrbPositions = this.shell.getFacetLocalPositions().flatMap((facetPosition, facetIndex) => {
            const facetNormal = uplinkFacetNormals[facetIndex];
            if (facetNormal === undefined || Vector3.Dot(facetNormal, Vector3.Normalize(facetPosition)) > -0.9) {
                return [];
            }

            return [facetPosition.add(facetNormal.scale(orbRadius + surfaceOrbClearance))];
        });
        this.shell.disableFacetData();

        this.initRings(scene);

        const centralOrb = CreateSphere("centralOrb", { diameter: 2 * orbRadius }, scene);
        centralOrb.parent = this.shell;

        const centralOrbMaterial = new PBRMaterial("orbMat", scene);
        centralOrbMaterial.emissiveColor.setAll(1);

        centralOrb.material = centralOrbMaterial;

        const orbInstanceBuffer = new Float32Array((surfaceOrbPositions.length + 1) * 16);
        orbInstanceBuffer.set(Matrix.IdentityReadOnly.asArray(), 0);
        for (const [orbIndex, position] of surfaceOrbPositions.entries()) {
            orbInstanceBuffer.set(
                Matrix.Translation(position.x, position.y, position.z).asArray(),
                (orbIndex + 1) * 16,
            );
        }
        centralOrb.thinInstanceSetBuffer("matrix", orbInstanceBuffer, 16, true);

        const centralLight = new PointLight(`${model.type}CentralLight`, Vector3.Zero(), scene, true);
        centralLight.range = 2 * outerRadius;
        centralLight.intensity = 1e5;
        centralLight.diffuse = Color3.White();
        centralLight.parent = this.shell;
        this.lights.push(centralLight);

        for (const [lightIndex, position] of surfaceOrbPositions.entries()) {
            const light = new PointLight(`${model.type}SurfaceLight${lightIndex}`, position, scene, true);
            light.range = 150;
            light.diffuse = Color3.White();
            light.parent = this.shell;
            this.lights.push(light);
        }

        for (const sourceMesh of sourceMeshes) {
            sourceMesh.dispose();
        }
        for (const csg of csgs) {
            csg.dispose();
        }
    }

    private initRings(scene: Scene) {
        const ringMaterial = new PBRMaterial("uplinkRingMaterial", scene);
        ringMaterial.albedoColor = Color3.Black();
        ringMaterial.roughness = 0.2;
        ringMaterial.metallic = 0;

        const ringCount = 4;
        const minRingRadius = 250;
        const maxRingRadius = 650;
        const ringWidth = 5;
        const ringHeight = 40;

        for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
            const ringRadius = minRingRadius + (ringIndex * (maxRingRadius - minRingRadius)) / (ringCount - 1);
            const ring = createRing(ringRadius, ringWidth, ringHeight, 64, scene);
            ring.name = `Ring${ringIndex}`;
            const initialRotation = Quaternion.FromEulerAngles(
                2 * Math.PI * Math.random(),
                2 * Math.PI * Math.random(),
                2 * Math.PI * Math.random(),
            );
            ring.rotationQuaternion = initialRotation;
            ring.material = ringMaterial;
            ring.parent = this.shell;

            const ringNormal = Axis.Y.rotateByQuaternionToRef(initialRotation, Vector3.Zero());
            const rotationAxis = Vector3.Cross(ringNormal, Axis.Y);
            if (rotationAxis.lengthSquared() < 1e-6) {
                rotationAxis.copyFrom(Axis.X);
            } else {
                rotationAxis.normalize();
            }

            this.rings.push({ mesh: ring, rotationAxis, rotationPeriod: 0.1 * ringRadius });
        }
    }

    getTransform() {
        return this.shell;
    }

    setState(state: UplinkState) {
        this.state = state;
    }

    update(deltaSeconds: number) {
        const velocityHalfLife = 1;
        switch (this.state) {
            case "idle":
                this.ringRotationMask = lerpSmooth(this.ringRotationMask, 0, velocityHalfLife, deltaSeconds);
                break;
            case "scanning":
                this.ringRotationMask = lerpSmooth(this.ringRotationMask, 1, velocityHalfLife, deltaSeconds);
                break;
            default:
                assertUnreachable(this.state);
        }

        this.updateRingRotation(deltaSeconds);
    }

    private updateRingRotation(deltaSeconds: number) {
        if (this.ringRotationMask === 0) {
            return;
        }

        for (const { mesh, rotationAxis, rotationPeriod } of this.rings) {
            const rotationQuaternion = mesh.rotationQuaternion;
            if (rotationQuaternion === null) {
                continue;
            }

            const deltaRotation = Quaternion.RotationAxisToRef(
                rotationAxis,
                (2 * Math.PI * deltaSeconds * this.ringRotationMask) / rotationPeriod,
                this.tempRingRotation,
            );

            deltaRotation.multiplyToRef(rotationQuaternion, rotationQuaternion);
        }
    }
}
