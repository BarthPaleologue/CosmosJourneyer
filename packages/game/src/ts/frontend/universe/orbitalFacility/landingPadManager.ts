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

import { Observable } from "@babylonjs/core/Misc/observable";

import { type Targetable } from "@/frontend/universe/architecture/targetable";

export const LandingPadSize = {
    SMALL: 1,
    MEDIUM: 2,
    LARGE: 3,
} as const;
export type LandingPadSize = (typeof LandingPadSize)[keyof typeof LandingPadSize];

export type LandingRequest = {
    minimumPadSize: LandingPadSize;
};

export interface ILandingPad extends Targetable {
    getPadSize(): LandingPadSize;
    getPadHeight(): number;
}

export const LandingPadStatus = {
    AVAILABLE: "available",
    OCCUPIED: "occupied",
} as const;
export type LandingPadStatus = (typeof LandingPadStatus)[keyof typeof LandingPadStatus];

export type StatusChangedHandler = (status: LandingPadStatus) => void;

/**
 * Manages landing pads for orbital facilities such as space stations and space elevators
 */
export class LandingPadManager {
    private readonly landingPads: ReadonlyArray<ILandingPad>;
    private readonly landingPadStatus: Map<ILandingPad, LandingPadStatus> = new Map();
    readonly onStatusChanged: Observable<{ pad: ILandingPad; status: LandingPadStatus }> = new Observable();

    /**
     * @param landingPads Array of landing pads to be managed
     */
    constructor(landingPads: ReadonlyArray<ILandingPad>) {
        this.landingPads = [...landingPads];
        for (const pad of this.landingPads) {
            this.setPadState(pad, LandingPadStatus.AVAILABLE);
        }
    }

    /**
     * Handles landing requests based on minimum pad size requirements
     * @param request The landing request containing minimum pad size requirement
     * @returns A suitable landing pad if available, null otherwise
     */
    public handleLandingRequest(request: LandingRequest): ILandingPad | null {
        const availableLandingPads = this.getAvailableLandingPads()
            .filter((landingPad) => {
                return landingPad.getPadSize() >= request.minimumPadSize;
            })
            .sort((a, b) => {
                return a.getPadSize() - b.getPadSize();
            });

        const availablePad = availableLandingPads[0];
        if (availablePad === undefined) {
            return null;
        }

        this.setPadState(availablePad, LandingPadStatus.OCCUPIED);
        return availablePad;
    }

    /**
     * Cancels a landing request, making the pad available again
     * @param pad The landing pad to make available
     */
    public cancelLandingRequest(pad: ILandingPad): void {
        this.setPadState(pad, LandingPadStatus.AVAILABLE);
    }

    /**
     * Returns all landing pads, including those that are currently in use
     */
    public getLandingPads(): ReadonlyArray<ILandingPad> {
        return this.landingPads;
    }

    /**
     * Returns all landing pads that are currently available for landing
     */
    public getAvailableLandingPads(): ReadonlyArray<ILandingPad> {
        return this.getLandingPads().filter((landingPad) => {
            return this.landingPadStatus.get(landingPad) === LandingPadStatus.AVAILABLE;
        });
    }

    private setPadState(landingPad: ILandingPad, status: LandingPadStatus): void {
        this.landingPadStatus.set(landingPad, status);
        this.onStatusChanged.notifyObservers({ pad: landingPad, status });
    }
}
