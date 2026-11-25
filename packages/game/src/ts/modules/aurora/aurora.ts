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

import { Axis } from "@babylonjs/core";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { Scene } from "@babylonjs/core/scene";
import {
    degreesToRadians,
    getAuroralVisibleEnergyFlux,
    getDipoleFieldLineLatitude,
    getMagnetopauseStandoffDistance,
    getPolarCapLatitude,
    getStellarWind,
    getStellarWindDynamicPressure,
    ampereSquareMeters,
    meters,
    pascals,
    radians,
} from "@cosmos-journeyer/physics";
import type { LocalStellarWindModel } from "@cosmos-journeyer/physics";
import type { IndexedRng } from "@cosmos-journeyer/random";
import { randRange, seededSquirrelNoise } from "@cosmos-journeyer/random";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import type { MagneticFieldModel } from "@cosmos-journeyer/universe-model";

import type { SystemContent } from "@/frontend/systemEntity/systemEntity";

import type { StellarWindSource } from "../stellarWindSources";
import { AuroraMaterial } from "./auroraMaterial";

const maxRibbonCountPerHemisphere = 500;

/**
 * Auroras from the interaction between a magnetosphere and the stellar wind.
 * TODO: account for rotation induced auroras like on Jupiter.
 */
export class Aurora implements SystemContent {
    private readonly root: Mesh;
    private readonly planetRadius: number;
    private readonly moment: number;
    private readonly matrixBuffer: Float32Array;
    private readonly material: AuroraMaterial;
    private readonly rng: IndexedRng;

    constructor(planetRadius: number, magneticField: DeepReadonly<MagneticFieldModel>, seed: number, scene: Scene) {
        const ribbons = new Mesh("Ribbons", scene);
        ribbons.isUnIndexed = true;
        ribbons.isPickable = false;

        this.root = ribbons;
        this.planetRadius = planetRadius;
        this.moment = magneticField.magnitude;
        this.rng = seededSquirrelNoise(seed);
        ribbons.setEnabled(false);

        const magneticAxis = geographicToCartesianToRef(
            magneticField.north.latitude,
            magneticField.north.longitude,
            Vector3.Up(),
        );
        this.root.rotationQuaternion = Quaternion.FromUnitVectorsToRef(
            Vector3.UpReadOnly,
            magneticAxis,
            Quaternion.Identity(),
        );

        const vertexData = createRibbonVertexData();
        vertexData.applyToMesh(ribbons);

        this.material = new AuroraMaterial(scene, seed);
        ribbons.material = this.material.get();

        this.matrixBuffer = new Float32Array(16 * maxRibbonCountPerHemisphere * 2);
        ribbons.thinInstanceSetBuffer("matrix", this.matrixBuffer, 16, false);
        ribbons.thinInstanceCount = 0;
    }

    /**
     * Updates the auroral oval and brightness from the incident stellar wind.
     * @param sources The stars emitting wind toward the planet, with live positions.
     */
    update(sources: ReadonlyArray<StellarWindSource>): void {
        const position = this.root.getAbsolutePosition();

        let pressure = 0;
        let dominantWind: LocalStellarWindModel | null = null;
        let dominantPressure = -1;
        for (const source of sources) {
            const distance = Vector3.Distance(position, source.position);
            const wind = getStellarWind(source.mass, source.radius, meters(distance));
            const sourcePressure = getStellarWindDynamicPressure(wind);
            // Approximate multiple winds by adding their scalar dynamic pressures.
            pressure += sourcePressure;
            if (sourcePressure > dominantPressure) {
                dominantPressure = sourcePressure;
                dominantWind = wind;
            }
        }

        const standoffDistance = getMagnetopauseStandoffDistance(ampereSquareMeters(this.moment), pascals(pressure));
        if (pressure <= 0 || standoffDistance <= this.planetRadius) {
            // A crushed magnetosphere has no closed dipole field lines above the surface.
            this.root.setEnabled(false);
            this.material.setEnergyFlux(0);
            return;
        }
        this.root.setEnabled(true);

        let energyFlux = 0;
        if (dominantWind !== null) {
            const capLatitude = getPolarCapLatitude(
                meters(this.planetRadius),
                ampereSquareMeters(this.moment),
                dominantWind,
            );
            energyFlux = getAuroralVisibleEnergyFlux(
                meters(this.planetRadius),
                ampereSquareMeters(this.moment),
                dominantWind,
                [radians(0.8 * capLatitude), capLatitude],
            );
        }
        this.material.setEnergyFlux(energyFlux);

        const latitudeNorthPolward = getDipoleFieldLineLatitude(standoffDistance, meters(this.planetRadius));
        const latitudeNorthEquatorward = latitudeNorthPolward - degreesToRadians(3);
        const latitudeCircumference = this.planetRadius * Math.sin(latitudeNorthPolward);
        const ribbonCountPerHemisphere = Math.min(Math.ceil(latitudeCircumference / 40e3), maxRibbonCountPerHemisphere);

        createRibbonMatrixBuffer(
            [latitudeNorthEquatorward, latitudeNorthPolward],
            this.planetRadius,
            ribbonCountPerHemisphere,
            this.matrixBuffer,
            0,
            this.rng,
            0,
        );

        createRibbonMatrixBuffer(
            [latitudeNorthPolward * -1, latitudeNorthEquatorward * -1],
            this.planetRadius,
            ribbonCountPerHemisphere,
            this.matrixBuffer,
            ribbonCountPerHemisphere * 16,
            this.rng,
            ribbonCountPerHemisphere,
        );

        this.root.thinInstanceBufferUpdated("matrix");
        this.root.thinInstanceCount = ribbonCountPerHemisphere * 2;
        this.root.thinInstanceRefreshBoundingInfo();
    }

    dispose() {
        this.material.dispose();
        this.root.dispose(false, true);
    }

    getTransform() {
        return this.root;
    }
}

/**
 * @param latitudeRange Equatorward and poleward magnetic latitudes in radians.
 * @param planetRadius Distance from the planet center in meters.
 * @param ribbonCount Number of ribbons to place in this hemisphere.
 * @param target Instance matrix buffer to fill.
 * @param offset First matrix component to write.
 * @param rng Deterministic random source for ribbon placement.
 * @param indexOffset Base index offset into the rng, so each hemisphere samples different values.
 */
function createRibbonMatrixBuffer(
    latitudeRange: [number, number],
    planetRadius: number,
    ribbonCount: number,
    target: Float32Array,
    offset: number,
    rng: IndexedRng,
    indexOffset: number,
) {
    const localUp = Vector3.Zero();
    const localUpRotation = Quaternion.Identity();
    const position = Vector3.Zero();
    const longitudeRotation = Quaternion.Identity();
    const localYaw = Quaternion.Identity();
    const matrix = Matrix.Identity();
    const tangentialMaxDivergence = degreesToRadians(20);
    for (let i = 0; i < ribbonCount; i++) {
        const baseRngIndex = indexOffset + i * 3;
        // Longitude is drawn uniformly so that the seed fully reshuffles the
        // ribbon longitudes instead of only jittering a regular ring.
        const longitude = randRange(0, 2 * Math.PI, rng, baseRngIndex);
        const latitude = randRange(latitudeRange[0], latitudeRange[1], rng, baseRngIndex + 1);
        geographicToCartesianToRef(latitude, longitude, localUp);

        localUp.scaleToRef(planetRadius, position);

        Quaternion.RotationAxisToRef(Axis.Y, -longitude + Math.PI / 2, longitudeRotation);
        Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, localUp, localUpRotation);

        Quaternion.RotationAxisToRef(
            localUp,
            randRange(tangentialMaxDivergence * -1, tangentialMaxDivergence, rng, baseRngIndex + 2),
            localYaw,
        );

        localUpRotation.multiplyToRef(longitudeRotation, longitudeRotation);
        localYaw.multiplyToRef(longitudeRotation, longitudeRotation);

        Matrix.ComposeToRef(Vector3.OneReadOnly, longitudeRotation, position, matrix).copyToArray(
            target,
            offset + i * 16,
        );
    }
}

/**
 * @returns Aurora ribbon geometry in meters.
 */
function createRibbonVertexData(): VertexData {
    const rowVertexCount = 128;
    const ribbonPositions = new Float32Array(rowVertexCount * 2 * 3);

    for (let i = 0; i < rowVertexCount; i++) {
        for (let j = 0; j < 2; j++) {
            const isTopVertex = j === 0;
            const x = i / (rowVertexCount - 1) - 0.5;
            const y = isTopVertex ? 1 : 0;
            const z = 0;

            const vertexIndex = 2 * i + j;

            ribbonPositions[vertexIndex * 3 + 0] = x;
            ribbonPositions[vertexIndex * 3 + 1] = y;
            ribbonPositions[vertexIndex * 3 + 2] = z;
        }
    }

    const vertexData = new VertexData();
    vertexData.positions = ribbonPositions;

    return vertexData;
}

/**
 * @param latitude Latitude in radians.
 * @param longitude Longitude in radians.
 * @param ref Vector receiving the unit direction.
 * @returns The supplied vector.
 */
function geographicToCartesianToRef(latitude: number, longitude: number, ref: Vector3) {
    const cosLatitude = Math.cos(latitude);
    ref.set(cosLatitude * Math.cos(longitude), Math.sin(latitude), cosLatitude * Math.sin(longitude));
    return ref;
}
