//  This file is part of Cosmos Journeyer
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

import { Settings } from "../settings";
import { clamp } from "../utils/math";
import { moveTowards } from "../utils/moveTowards";

const enum WarpDriveState {
    /**
     * The warp drive is disabled. It can be enabled by the user.
     */
    DISABLED,

    /**
     * The warp drive is enabled. It can be desengaged by the user.
     * This means that the drive cannot be disabled right away. It needs to be desengaged first for the deceleration to be effective.
     */
    ENABLED,

    /**
     * The warp drive is desengaging. The warp speed is decreasing until it reaches 0.
     * When the warp speed reaches 0, the warp drive is disabled.
     */
    DESENGAGING
}

/**
 * Interface of the warp drive of a spaceship that can only be read.
 */
export interface ReadonlyWarpDrive {
    /**
     * Returns true if the warp drive is enabled and not desengaging. Returns false otherwise.
     * @returns True if the warp drive is enabled and not desengaging. Returns false otherwise.
     */
    isEnabled(): boolean;

    /**
     * Returns true if the warp drive is disabled. Returns false otherwise.
     * @returns True if the warp drive is disabled. Returns false otherwise.
     */
    isDisabled(): boolean;

    /**
     * Returns true if the warp drive is desengaging. Returns false otherwise.
     * @returns True if the warp drive is desengaging. Returns false otherwise.
     */
    isDesengaging(): boolean;

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
    /**
     * The throttle lags behind the target throttle. Hence, the current throttle is not equal to the target throttle.
     */
    private currentThrottle = 0;

    /**
     * User throttle of the warp drive. It is a value between 0 and 1. It constrains the target speed of the warp drive.
     * (0 means the target speed is 0, 1 means the target speed is maximal)
     */
    private targetThrottle = 1;

    /**
     * Speed at which the throttle catches up to the target throttle.
     */
    private readonly throttleUpdateSpeed = 0.2;

    /**
     * Target speed of the warp drive in m/s. It is computed based on the distance to the closest body and the user throttle.
     */
    private targetSpeed = 0;

    /**
     * Current speed of the warp drive in m/s.
     */
    private currentSpeed = 0;

    /**
     * Current state of the warp drive.
     */
    private state = WarpDriveState.DISABLED;

    /**
     * Maximum speed of the warp drive in m/s. It can be reached when the ship is far from any body and the user throttle is set to 1.
     */
    private static readonly MAX_SPEED = 10 * Settings.C;

    private static readonly MIN_SPEED = 5e3;

    constructor(enabledByDefault = false) {
        this.state = enabledByDefault ? WarpDriveState.ENABLED : WarpDriveState.DISABLED;
    }

    /**
     * Enables the warp drive: the ship will start to accelerate towards the target speed.
     */
    public enable(): void {
        this.state = WarpDriveState.ENABLED;
    }

    /**
     * Desengages the warp drive: the ship will start to decelerate towards 0. The warp drive will be disabled when the ship reaches 0 speed.
     */
    public desengage(): void {
        this.state = WarpDriveState.DESENGAGING;
    }

    /**
     * Disables the warp drive: the target speed, the current speed and the internal throttle are set to 0.
     */
    private disable(): void {
        this.state = WarpDriveState.DISABLED;
        this.targetSpeed = 0;
        this.currentThrottle = 0;
        this.currentSpeed = 0;
    }

    public isEnabled(): boolean {
        return this.state === WarpDriveState.ENABLED;
    }

    public isDisabled(): boolean {
        return this.state === WarpDriveState.DISABLED;
    }

    public isDesengaging(): boolean {
        return this.state === WarpDriveState.DESENGAGING;
    }

    /**
     * Computes the target speed of the warp drive based on the distance to the closest body and the user throttle.
     * @param closestObjectDistance The distance to the closest body in m.
     * @param closestObjectRadius
     * @returns The computed target speed in m/s.
     */
    public updateTargetSpeed(closestObjectDistance: number, closestObjectRadius: number): number {
        const speedThreshold = 10e3;
        const closeSpeed = (speedThreshold * 0.05 * Math.max(0, closestObjectDistance - closestObjectRadius)) / speedThreshold;
        const deepSpaceSpeed = speedThreshold * ((0.05 * Math.max(0, closestObjectDistance - closestObjectRadius)) / speedThreshold) ** 1.2;
        this.targetSpeed = Math.min(WarpDrive.MAX_SPEED, Math.max(closeSpeed, deepSpaceSpeed));
        this.targetSpeed = Math.max(WarpDrive.MIN_SPEED, this.targetSpeed);
        return this.targetThrottle * this.targetSpeed;
    }

    /**
     * Increases the target throttle by the given delta and clamps it between 0 and 1.
     * @param delta The delta to apply to the target throttle.
     */
    public increaseTargetThrottle(delta: number): void {
        this.targetThrottle = clamp(this.targetThrottle + delta, 0, 1);
    }

    public getWarpSpeed(): number {
        return this.currentSpeed;
    }

    public getThrottle(): number {
        return this.targetThrottle;
    }

    /**
     * Updates the current speed of the warp drive speed based on the current speed of the ship and the target speed.
     * @param currentForwardSpeed The current speed of the warp drive projected on the forward direction of the ship.
     * @param deltaTime The time elapsed since the last update in seconds.
     */
    private updateWarpDriveSpeed(currentForwardSpeed: number, deltaTime: number): void {
        const deltaThrottle = this.throttleUpdateSpeed * deltaTime;

        this.currentThrottle = moveTowards(this.currentThrottle, this.targetThrottle, deltaThrottle);

        this.currentSpeed = this.currentThrottle * this.targetSpeed;
    }

    /**
     * Updates the warp drive based on the current speed of the ship, the distance to the closest body and the time elapsed since the last update.
     * @param currentForwardSpeed The current speed of the warp drive projected on the forward direction of the ship.
     * @param closestObjectDistance
     * @param clostestObjectRadius
     * @param deltaTime The time elapsed since the last update in seconds.
     */
    public update(currentForwardSpeed: number, closestObjectDistance: number, clostestObjectRadius: number, deltaTime: number): void {
        switch (this.state) {
            case WarpDriveState.DESENGAGING:
                this.targetSpeed *= 0.9;
                this.updateWarpDriveSpeed(currentForwardSpeed, deltaTime);
                if (this.targetSpeed <= WarpDrive.MIN_SPEED && this.currentSpeed <= WarpDrive.MIN_SPEED) this.disable();
                break;
            case WarpDriveState.ENABLED:
                this.updateTargetSpeed(closestObjectDistance, clostestObjectRadius);
                this.updateWarpDriveSpeed(currentForwardSpeed, deltaTime);
                break;
            case WarpDriveState.DISABLED:
                this.targetSpeed = 0;
                this.currentSpeed = 0;
                this.currentThrottle = 0;
                break;
        }
    }
}
