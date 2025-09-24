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

import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import {
    getDiscoveryScannerSpec,
    type SerializedDiscoveryScanner,
} from "@/backend/spaceship/serializedComponents/discoveryScanner";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { type CelestialBody } from "@/frontend/universe/architecture/orbitalObject";

import { assertUnreachable } from "@/utils/types";

export class DiscoveryScanner {
    readonly type;
    readonly relativeRange: number;

    readonly size: number;
    readonly quality: number;

    constructor(serializedDiscoveryScanner: SerializedDiscoveryScanner) {
        this.type = serializedDiscoveryScanner.type;
        this.size = serializedDiscoveryScanner.size;
        this.quality = serializedDiscoveryScanner.quality;

        const spec = getDiscoveryScannerSpec(serializedDiscoveryScanner);

        this.relativeRange = spec.relativeRange;
    }

    serialize() {
        return {
            type: this.type,
            size: this.size,
            quality: this.quality,
        };
    }
}

export function isScannerInRange(scanner: DiscoveryScanner, playerPosition: Vector3, celestialBody: CelestialBody) {
    let baseDistanceMultiplier: number;
    const type = celestialBody.type;
    switch (type) {
        case OrbitalObjectType.TELLURIC_PLANET:
        case OrbitalObjectType.TELLURIC_SATELLITE:
        case OrbitalObjectType.GAS_PLANET:
        case OrbitalObjectType.MANDELBULB:
        case OrbitalObjectType.JULIA_SET:
        case OrbitalObjectType.MANDELBOX:
        case OrbitalObjectType.SIERPINSKI_PYRAMID:
        case OrbitalObjectType.MENGER_SPONGE:
        case OrbitalObjectType.DARK_KNIGHT:
        case OrbitalObjectType.STAR:
            baseDistanceMultiplier = 1;
            break;
        case OrbitalObjectType.NEUTRON_STAR:
            baseDistanceMultiplier = 70_000;
            break;
        case OrbitalObjectType.BLACK_HOLE:
            baseDistanceMultiplier = 20;
            break;
        default:
            assertUnreachable(type);
    }

    const totalMultiplier = baseDistanceMultiplier * scanner.relativeRange;

    const distance2 = Vector3.DistanceSquared(playerPosition, celestialBody.getTransform().position);

    return distance2 < (celestialBody.getBoundingRadius() * totalMultiplier) ** 2;
}
