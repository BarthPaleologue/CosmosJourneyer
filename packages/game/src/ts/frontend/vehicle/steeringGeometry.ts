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

import { clamp } from "@/utils/math";

/** Frame-local wheel geometry; left/right Ackermann differences and tire slip are ignored. */
type SteeringWheelGeometry = {
    readonly position: { readonly x: number; readonly z: number };
    readonly steerable: boolean;
};

export type SteeringGeometry = {
    readonly steeringReferenceZ: number;
    readonly referenceLeverArm: number;
};

type SteeringGeometryOptions = {
    readonly steeringReferenceZOverride: number | undefined;
};

// Axles within one millimeter are treated as coincident.
const AxleTolerance = 0.001;

/**
 * A fixed axle anchors the turning reference. With no fixed axle, assume symmetric
 * counter-phase steering about the midpoint of the extreme steering axles.
 * Multiple fixed axles require an explicit approximation via an override.
 * Undefined means the caller must use legacy steering.
 */
export function deriveSteeringGeometry(
    wheels: ReadonlyArray<SteeringWheelGeometry>,
    options?: Partial<SteeringGeometryOptions>,
): SteeringGeometry | undefined {
    const steeringReferenceZOverride = options?.steeringReferenceZOverride;
    const steerableWheels = wheels.filter((wheel) => wheel.steerable);
    if (
        steerableWheels.length === 0 ||
        wheels.some((wheel) => !Number.isFinite(wheel.position.x) || !Number.isFinite(wheel.position.z))
    ) {
        return undefined;
    }
    const steerableWheelZs = steerableWheels.map((wheel) => wheel.position.z);
    const fixedWheelZs = wheels.filter((wheel) => !wheel.steerable).map((wheel) => wheel.position.z);
    let steeringReferenceZ: number;
    if (steeringReferenceZOverride !== undefined) {
        if (!Number.isFinite(steeringReferenceZOverride)) {
            return undefined;
        }
        steeringReferenceZ = steeringReferenceZOverride;
    } else if (fixedWheelZs.length > 0) {
        if (Math.max(...fixedWheelZs) - Math.min(...fixedWheelZs) > AxleTolerance) {
            return undefined;
        }
        steeringReferenceZ = fixedWheelZs.reduce((sum, z) => sum + z, 0) / fixedWheelZs.length;
    } else {
        const frontZ = Math.max(...steerableWheelZs);
        const rearZ = Math.min(...steerableWheelZs);
        if (frontZ - rearZ <= AxleTolerance) {
            return undefined;
        }
        steeringReferenceZ = (frontZ + rearZ) / 2;
    }
    const referenceLeverArm = Math.max(...steerableWheelZs.map((z) => Math.abs(z - steeringReferenceZ)));
    if (referenceLeverArm <= AxleTolerance) {
        return undefined;
    }
    return { steeringReferenceZ, referenceLeverArm };
}

/** The requested angle is virtual: it acts at the largest steering lever arm. */
export function computeSpeedLimitedCurvature(
    requestedSteeringAngle: number,
    referenceLeverArm: number,
    speed: number,
    maxLateralAcceleration: number,
    mechanicalAngleLimit: number,
): number {
    if (referenceLeverArm <= AxleTolerance) {
        return 0;
    }
    const angle = clamp(requestedSteeringAngle, -mechanicalAngleLimit, mechanicalAngleLimit);
    const requestedCurvature = Math.tan(angle) / referenceLeverArm;
    const maxCurvature = Math.abs(speed) < 0.001 ? Infinity : maxLateralAcceleration / (speed * speed);
    return clamp(requestedCurvature, -maxCurvature, maxCurvature);
}

export function getWheelSteeringAngle(curvature: number, leverArm: number, mechanicalAngleLimit: number): number {
    return clamp(Math.atan(curvature * leverArm), -mechanicalAngleLimit, mechanicalAngleLimit);
}
