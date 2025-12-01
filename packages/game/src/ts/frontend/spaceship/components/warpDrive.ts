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

import { getWarpDriveSpec, type SerializedWarpDrive } from "@/backend/spaceship/serializedComponents/warpDrive";

import { lerpSmooth } from "@/frontend/helpers/animations/interpolations";

import { clamp, remap } from "@/utils/math";

const enum WarpDriveState {
    /**
     * The warp drive is disabled. It can be enabled by the user.
     */
    DISABLED,

    /**
     * The warp drive is enabled. It can be disengaged by the user.
     * This means that the drive cannot be disabled right away. It needs to be disengaged first for the deceleration to be effective.
     */
    ENABLED,

    /**
     * The warp drive is disengaging. The warp speed is decreasing until it reaches 0.
     * When the warp speed reaches 0, the warp drive is disabled.
     */
    DISENGAGING,
}

/**
 * Interface of the warp drive of a spaceship that can only be read.
 */
export interface ReadonlyWarpDrive {
    /**
     * Returns true if the warp drive is enabled and not disengaging. Returns false otherwise.
     * @returns True if the warp drive is enabled and not disengaging. Returns false otherwise.
     */
    isEnabled(): boolean;

    /**
     * Returns true if the warp drive is disabled. Returns false otherwise.
     * @returns True if the warp drive is disabled. Returns false otherwise.
     */
    isDisabled(): boolean;

    /**
     * Returns true if the warp drive is disengaging. Returns false otherwise.
     * @returns True if the warp drive is disengaging. Returns false otherwise.
     */
    isDisengaging(): boolean;

    /**
     * Returns the current speed of the warp drive in m/s.
     * @returns The current speed of the warp drive in m/s.
     */
    getWarpSpeed(): number;

    /**
     * Returns the current target throttle of the warp drive.
     * @returns The current target throttle of the warp drive.
     */
    getThrottle(): number;
}

export class WarpDrive implements ReadonlyWarpDrive {
    readonly type;

    /**
     * The default throttle value for the warp drive.
     */
    public readonly defaultThrottle: number = 0.5;

    /**
     * The throttle of the warp drive (target speed is modulated by this value).
     */
    private throttle = 1;

    /**
     * Maximum speed of the warp drive in m/s. It can be reached when the ship is far from any body and the user throttle is set to 1.
     */
    readonly maxWarpSpeed: number;

    private static readonly MIN_WARP_SPEED = 30e3;

    readonly rangeLY: number;

    /**
     * Target speed of the warp drive in m/s. It is computed based on the distance to the closest body and the user throttle.
     */
    private maxTargetSpeed = 0;

    /**
     * Current speed of the warp drive in m/s.
     */
    private currentSpeed = 0;

    /**
     * Current state of the warp drive.
     */
    private state = WarpDriveState.DISABLED;

    readonly size: number;
    readonly quality: number;

    private isAcceleratingFlag = false;

    constructor(serializedWarpDrive: SerializedWarpDrive, enabledByDefault = false) {
        this.type = serializedWarpDrive.type;

        this.size = serializedWarpDrive.size;
        this.quality = serializedWarpDrive.quality;

        const spec = getWarpDriveSpec(serializedWarpDrive);

        this.maxWarpSpeed = spec.maxSpeed;
        this.rangeLY = spec.rangeLy;

        this.state = enabledByDefault ? WarpDriveState.ENABLED : WarpDriveState.DISABLED;
    }

    public serialize(): SerializedWarpDrive {
        return {
            type: this.type,
            size: this.size,
            quality: this.quality,
        };
    }

    /**
     * Enables the warp drive: the ship will start to accelerate towards the target speed.
     */
    public enable(): void {
        this.state = WarpDriveState.ENABLED;
        this.throttle = this.defaultThrottle;
    }

    /**
     * Disengages the warp drive: the ship will start to decelerate towards 0. The warp drive will be disabled when the ship reaches 0 speed.
     */
    public disengage(): void {
        this.state = WarpDriveState.DISENGAGING;
    }

    public emergencyStop(): void {
        this.disable();
    }

    /**
     * Disables the warp drive: the target speed, the current speed and the internal throttle are set to 0.
     */
    private disable(): void {
        this.state = WarpDriveState.DISABLED;
        this.maxTargetSpeed = 0;
        this.throttle = 0;
        this.currentSpeed = 0;
    }

    public isEnabled(): boolean {
        return this.state === WarpDriveState.ENABLED;
    }

    public isDisabled(): boolean {
        return this.state === WarpDriveState.DISABLED;
    }

    public isDisengaging(): boolean {
        return this.state === WarpDriveState.DISENGAGING;
    }

    public isAccelerating(): boolean {
        return this.isAcceleratingFlag;
    }

    /**
     * Computes the target speed of the warp drive based on the distance to the closest body and the user throttle.
     * @param closestObjectDistance The distance to the closest body in m.
     * @param closestObjectRadius
     * @returns The computed target speed in m/s.
     */
    public updateMaxTargetSpeed(closestObjectDistance: number, closestObjectRadius: number): number {
        const speedThreshold = 10e3;

        const collisionDistance = Math.max(0, closestObjectDistance - closestObjectRadius);

        const closeSpeed = (speedThreshold * 0.1 * collisionDistance) / speedThreshold;
        const deepSpaceSpeed = speedThreshold * ((0.1 * collisionDistance) / speedThreshold) ** 1.2;
        this.maxTargetSpeed = clamp(Math.max(closeSpeed, deepSpaceSpeed), WarpDrive.MIN_WARP_SPEED, this.maxWarpSpeed);
        return this.maxTargetSpeed;
    }

    /**
     * Increases the target throttle by the given delta and clamps it between 0 and 1.
     * @param deltaThrottle The delta to apply to the target throttle.
     */
    public increaseThrottle(deltaThrottle: number): void {
        this.throttle = clamp(this.throttle + deltaThrottle, 0, 1);
    }

    /**
     * Safely sets the warp drive throttle to idle (0%)
     */
    public idleThrottle(): void {
        this.throttle = 0;
    }

    public getWarpSpeed(): number {
        return this.currentSpeed;
    }

    public getThrottle(): number {
        return this.throttle;
    }
    /**
     * Updates the current speed of the warp drive based on the target speed.
     * @param deltaSeconds The time elapsed since the last update in seconds.
     */
    private updateWarpDriveSpeed(deltaSeconds: number): void {
        // use lerp smoothing to reach target speed, while making it a bit harder to decelerate
        let newSpeed =
            this.currentSpeed < this.maxTargetSpeed
                ? lerpSmooth(this.currentSpeed, this.throttle * this.maxTargetSpeed, 0.1, deltaSeconds) // acceleration
                : lerpSmooth(this.currentSpeed, this.throttle * this.maxTargetSpeed, 0.6, deltaSeconds); // deceleration
        newSpeed = clamp(newSpeed, WarpDrive.MIN_WARP_SPEED, this.maxWarpSpeed);

        const hysteresis = -1e3; // Avoid flickering between accelerating and decelerating states
        this.isAcceleratingFlag = newSpeed > this.currentSpeed + hysteresis;
        this.currentSpeed = newSpeed;
    }

    /**
     * Updates the warp drive based on the current speed of the ship, the distance to the closest body and the time elapsed since the last update.
     * @param closestObjectDistance
     * @param closestObjectRadius
     * @param deltaSeconds The time elapsed since the last update in seconds.
     */
    public update(closestObjectDistance: number, closestObjectRadius: number, deltaSeconds: number): void {
        switch (this.state) {
            case WarpDriveState.DISENGAGING:
                this.maxTargetSpeed *= 0.9;
                this.currentSpeed *= 0.9;
                if (this.maxTargetSpeed <= WarpDrive.MIN_WARP_SPEED && this.currentSpeed <= WarpDrive.MIN_WARP_SPEED)
                    this.disable();
                break;
            case WarpDriveState.ENABLED:
                this.updateMaxTargetSpeed(closestObjectDistance, closestObjectRadius);
                this.updateWarpDriveSpeed(deltaSeconds);
                break;
            case WarpDriveState.DISABLED:
                this.maxTargetSpeed = 0;
                this.currentSpeed = 0;
                this.throttle = 0;
                break;
        }
    }

    /**
     * @param speed The speed of the warp drive in m/s.
     * @returns the amount of fuel (L/s) consumed by the warp drive per second based on the current speed.
     */
    public getFuelConsumptionRate(speed: number) {
        const speed01 = remap(speed, WarpDrive.MIN_WARP_SPEED, this.maxWarpSpeed, 0, 1);
        return 0.15 * (speed01 - 0.75) ** 2 + 0.08; // minimum of 0.08 L/s at 75% throttle
    }

    /**
     * @returns the amount of fuel (L) consumed by the warp drive for a hyper jump of the given distance in light-years.
     */
    public getHyperJumpFuelConsumption(distanceLy: number): number {
        return 2 * distanceLy;
    }
}
