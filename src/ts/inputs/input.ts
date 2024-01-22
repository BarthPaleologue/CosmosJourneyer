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

export enum InputType {
    KEYBOARD,
    MOUSE,
    GAMEPAD
}

export interface Input {
    readonly type: InputType;

    /**
     * Returns a number between -1 and 1 describing the roll intensity
     */
    getRoll: () => number;

    /**
     * Returns a number between -1 and 1 describing the pitch intensity
     */
    getPitch: () => number;

    /**
     * Returns a number between -1 and 1 describing the yaw intensity
     */
    getYaw: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative Z Axis
     */
    getZAxis: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative X Axis
     */
    getXAxis: () => number;

    /**
     * Returns a number between -1 and 1 describing the movement along the relative Y Axis
     */
    getYAxis: () => number;

    /**
     * Get Acceleration
     */
    getAcceleration: () => number;
}
