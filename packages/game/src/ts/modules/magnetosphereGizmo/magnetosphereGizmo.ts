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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateLines } from "@babylonjs/core/Meshes/Builders/linesBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import {
    getDipoleFieldLineRadius,
    getMagnetopauseStandoffDistance,
    getStellarWind,
    getStellarWindDynamicPressure,
} from "@cosmos-journeyer/physics";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { MagneticFieldModel } from "@cosmos-journeyer/universe-model";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import type { StellarWindSource } from "../stellarWindSources";

const pointsPerLine = 64;
const meridianPlaneCount = 8;
/** Fractions of the magnetopause standoff distance; 1 is the outermost (magnetopause) field line. */
const fieldLineFractions = [1, 0.8, 0.6, 0.4, 0.25] as const;

type FieldLine = {
    mesh: Mesh;
    /** Unit-L point shapes in the magnetic frame, 3 floats per point. */
    shape: Float32Array;
    /** Reusable position buffer for line updates, 3 floats per point. */
    positions: Float32Array;
    fraction: number;
};

/**
 * Debug visualization of a body's magnetosphere: dipole field lines drawn as
 * simple line meshes (GreasedLines misbehave under the floating origin), with
 * the outermost line following the magnetopause standoff distance as the
 * incident stellar wind changes.
 */
export class MagnetosphereGizmo implements SystemContent {
    private readonly root: TransformNode;
    private readonly planetRadius: number;
    private readonly moment: number;
    private readonly lines: Array<FieldLine> = [];

    constructor(planetRadius: number, magneticField: DeepReadonly<MagneticFieldModel>, scene: Scene) {
        this.root = new TransformNode("MagnetosphereGizmo", scene);
        this.planetRadius = planetRadius;
        this.moment = magneticField.magnitude;
        this.root.setEnabled(false);

        // Orient +Y along the magnetic north axis, same convention as Aurora.
        const magneticAxis = geographicToCartesian(magneticField.north.latitude, magneticField.north.longitude);
        this.root.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
            Vector3.UpReadOnly,
            magneticAxis,
            Quaternion.Identity(),
        );

        // Unit-L field line shapes, one per meridian plane rotated around the magnetic axis (Y).
        for (const fraction of fieldLineFractions) {
            for (let plane = 0; plane < meridianPlaneCount; plane++) {
                const phi = (2 * Math.PI * plane) / meridianPlaneCount;
                const cosPhi = Math.cos(phi);
                const sinPhi = Math.sin(phi);

                const shape = new Float32Array(pointsPerLine * 3);
                for (let i = 0; i < pointsPerLine; i++) {
                    const theta = (Math.PI * (i + 0.5)) / pointsPerLine;
                    const r = getDipoleFieldLineRadius(1, theta);
                    const x = r * Math.sin(theta);
                    const y = r * Math.cos(theta);
                    shape[i * 3] = x * cosPhi;
                    shape[i * 3 + 1] = y;
                    shape[i * 3 + 2] = x * sinPhi;
                }

                const positions = scaleShapeToRef(shape, planetRadius, new Float32Array(shape.length));
                const mesh = CreateLines(
                    `FieldLine_${fraction}_${plane}`,
                    { points: toVector3Array(positions), updatable: true },
                    scene,
                );
                mesh.color = new Color3(0.2, 0.8, 1);
                mesh.isPickable = false;
                mesh.parent = this.root;
                this.lines.push({ mesh, shape, positions, fraction });
            }
        }
    }

    /**
     * Updates the field lines from the incident stellar wind: the outermost
     * line tracks the magnetopause standoff distance.
     * @param sources The stars emitting wind toward the body, with live positions.
     */
    update(sources: ReadonlyArray<StellarWindSource>): void {
        const position = this.root.getAbsolutePosition();

        let pressure = 0;
        for (const source of sources) {
            const distance = Vector3.Distance(position, source.position);
            pressure += getStellarWindDynamicPressure(getStellarWind(source.mass, source.radius, distance));
        }

        const standoffDistance = getMagnetopauseStandoffDistance(this.moment, pressure);
        if (pressure <= 0 || standoffDistance <= this.planetRadius) {
            // A crushed magnetosphere has no closed field lines above the surface.
            this.root.setEnabled(false);
            return;
        }
        this.root.setEnabled(true);

        for (const line of this.lines) {
            const scaled = scaleShapeToRef(line.shape, line.fraction * standoffDistance, line.positions);
            line.mesh.updateVerticesData(VertexBuffer.PositionKind, scaled, true, false);
        }
    }

    dispose(): void {
        this.root.dispose();
    }

    getTransform(): TransformNode {
        return this.root;
    }
}

/**
 * @param shape Unit-L point shapes, 3 floats per point.
 * @param lineMaxDistance L parameter of the field line in meters.
 * @param ref Buffer to write the scaled positions into, reused across updates.
 * @returns The same buffer as `ref`, filled with the scaled positions, 3 floats per point.
 */
function scaleShapeToRef(shape: Float32Array, lineMaxDistance: number, ref: Float32Array): Float32Array {
    for (let i = 0; i < shape.length; i++) {
        ref[i] = (shape[i] ?? 0) * lineMaxDistance;
    }
    return ref;
}

/**
 * @param positions Flat positions, 3 floats per point.
 * @returns The positions as Vector3 tuples for line creation.
 */
function toVector3Array(positions: Float32Array): Array<Vector3> {
    const points: Array<Vector3> = [];
    for (let i = 0; i < positions.length; i += 3) {
        points.push(new Vector3(positions[i] ?? 0, positions[i + 1] ?? 0, positions[i + 2] ?? 0));
    }
    return points;
}

/**
 * @param latitude Latitude in radians.
 * @param longitude Longitude in radians.
 * @returns The unit direction as a vector.
 */
function geographicToCartesian(latitude: number, longitude: number): Vector3 {
    const cosLatitude = Math.cos(latitude);
    return new Vector3(cosLatitude * Math.cos(longitude), Math.sin(latitude), cosLatitude * Math.sin(longitude));
}
