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

import type { Kilograms, Meters, Radians } from "@cosmos-journeyer/physics";
import type { Orbit, OrbitalObjectId, SpinModel } from "@cosmos-journeyer/universe-model";

export type SystemEntityModel<
    TContent extends SystemContentModel = SystemContentModel,
    TPlacement extends SystemEntityPlacementModel = SystemEntityPlacementModel,
> = {
    id: string;
    name: string;
    content: TContent;
    placement: TPlacement;
};

export type SystemContentModel<T extends string = string> = {
    type: T;
};

export type SystemEntityPlacementModel = InOrbitPlacementModel | OnSurfacePlacementModel | InFramePlacementModel;

export type InOrbitPlacementModel = {
    type: "inOrbit";
    mass: Kilograms;
    orbit: Orbit;
    attitude: AttitudeModel;
};

export type AttitudeModel = {
    spin: SpinModel;
    /** Model orientation relative to the spinning frame, in radians. */
    localFrameOrientation: {
        yaw: Radians;
        pitch: Radians;
        roll: Radians;
    };
};

export type OnSurfacePlacementModel = {
    type: "onSurface";
    parentId: OrbitalObjectId;
    position: {
        longitude: Radians;
        latitude: Radians;
        heightAboveGround: Meters;
    };
    rotation: OnSurfacePlacementRotation;
};

export type OnSurfacePlacementRotation = {
    /** 0 = geographic north, +π/2 = east */
    heading: Radians;
    /** Positive = nose up */
    pitch: Radians;
    /** Rotation around the forward axis */
    roll: Radians;
};

/** Placement in the parent's rotating local frame, with a coincident origin and axes. */
export type InFramePlacementModel = {
    type: "inFrame";
    parentId: OrbitalObjectId;
};
