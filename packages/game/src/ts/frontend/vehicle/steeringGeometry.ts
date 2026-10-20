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

/** Frame-local wheel geometry; tire slip is ignored. */
type SteeringWheelGeometry = {
    readonly position: { readonly x: number; readonly z: number };
    readonly steerable: boolean;
};

export type SteeringGeometry = {
    readonly steeringReferenceZ: number;
    readonly referenceLeverArm: number;
    readonly mechanicalCurvatureLimits: { readonly minCurvature: number; readonly maxCurvature: number };
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
 * @param wheels Wheel positions and steering capabilities in frame-local coordinates.
 * @param mechanicalAngleLimit Maximum absolute steering angle in radians.
 * @param options Optional explicit longitudinal position of the steering reference.
 * @returns Derived turning geometry, or `undefined` when the wheel layout cannot define it.
 */
export function deriveSteeringGeometry(
    wheels: ReadonlyArray<SteeringWheelGeometry>,
    mechanicalAngleLimit: number,
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
    return {
        steeringReferenceZ,
        referenceLeverArm,
        mechanicalCurvatureLimits: getMechanicalCurvatureLimits(wheels, steeringReferenceZ, mechanicalAngleLimit),
    };
}

/**
 * The requested angle is virtual: it acts at the largest steering lever arm.
 * @param requestedSteeringAngle Requested steering angle in radians.
 * @param referenceLeverArm Distance from the steering reference to the outer steering axle.
 * @param speed Vehicle speed used to limit lateral acceleration.
 * @param maxLateralAcceleration Maximum allowed lateral acceleration.
 * @param mechanicalAngleLimit Maximum steering angle in radians.
 * @returns Curvature limited by steering angle and lateral acceleration.
 */
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

/**
 * Bound curvature before computing Ackermann angles so no individual wheel hits
 * its stop early and breaks the common turning center. Positive motor angles
 * steer front wheels toward +X with the existing axle/frame constraints.
 * @param wheels Wheel positions and steering capabilities in frame-local coordinates.
 * @param steeringReferenceZ Longitudinal position of the turning reference.
 * @param mechanicalAngleLimit Maximum absolute steering angle in radians.
 * @returns Minimum and maximum curvature before any wheel exceeds its steering stop.
 */
export function getMechanicalCurvatureLimits(
    wheels: ReadonlyArray<SteeringWheelGeometry>,
    steeringReferenceZ: number,
    mechanicalAngleLimit: number,
): { readonly minCurvature: number; readonly maxCurvature: number } {
    const tangentLimit = Math.tan(mechanicalAngleLimit);
    let positiveDenominator = 0;
    let negativeDenominator = 0;
    for (const wheel of wheels) {
        if (!wheel.steerable) {
            continue;
        }
        const longitudinalLeverArm = Math.abs(wheel.position.z - steeringReferenceZ);
        positiveDenominator = Math.max(positiveDenominator, longitudinalLeverArm + wheel.position.x * tangentLimit);
        negativeDenominator = Math.max(negativeDenominator, longitudinalLeverArm - wheel.position.x * tangentLimit);
    }
    return {
        maxCurvature: positiveDenominator > AxleTolerance ? tangentLimit / positiveDenominator : Infinity,
        minCurvature: negativeDenominator > AxleTolerance ? -tangentLimit / negativeDenominator : -Infinity,
    };
}

/**
 * Ackermann about (1 / curvature, steeringReferenceZ); in-phase steering bypasses this model.
 * @param curvature Signed curvature of the vehicle's path.
 * @param leverArm Wheel's longitudinal offset from the turning reference.
 * @param mechanicalAngleLimit Maximum absolute steering angle in radians.
 * @param lateralPosition Wheel's lateral position in the vehicle frame.
 * @returns Clamped Ackermann steering angle in radians.
 */
export function getWheelSteeringAngle(
    curvature: number,
    leverArm: number,
    mechanicalAngleLimit: number,
    lateralPosition: number,
): number {
    if (leverArm === 0 || curvature === 0) {
        return 0;
    }
    return clamp(
        Math.atan2(curvature * leverArm, 1 - curvature * lateralPosition),
        -mechanicalAngleLimit,
        mechanicalAngleLimit,
    );
}
