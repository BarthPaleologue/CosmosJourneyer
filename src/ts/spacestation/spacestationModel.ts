//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { seededSquirrelNoise } from "squirrel-noise";
import { Settings } from "../settings";
import { GENERATION_STEPS } from "../model/common";
import { OrbitProperties } from "../orbit/orbitProperties";
import { getOrbitalPeriod } from "../orbit/orbit";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectModel } from "../architecture/orbitalObject";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";

export class SpaceStationModel implements OrbitalObjectModel {
    readonly seed: number;
    readonly rng: (step: number) => number;
    readonly orbit: OrbitProperties;
    readonly physicalProperties: OrbitalObjectPhysicalProperties;
    readonly parentBody: OrbitalObjectModel | null;
    readonly childrenBodies: OrbitalObjectModel[] = [];

    constructor(seed: number, parentBody?: OrbitalObjectModel) {
        this.seed = seed;
        this.rng = seededSquirrelNoise(this.seed);

        this.parentBody = parentBody ?? null;
        this.childrenBodies = [];

        //TODO: do not hardcode
        const orbitRadius = 3 * Settings.EARTH_RADIUS;

        this.orbit = {
            radius: orbitRadius,
            p: 2,
            period: getOrbitalPeriod(orbitRadius, this.parentBody?.physicalProperties.mass ?? 0),
            normalToPlane: Vector3.Up(),
            isPlaneAlignedWithParent: false
        };

        this.physicalProperties = {
            mass: 1,
            rotationPeriod: 60 * 2,
            axialTilt: 2 * this.rng(GENERATION_STEPS.AXIAL_TILT) * Math.PI
        };
    }
}
