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

import type { Orbit, OrbitalObjectId, Rotation } from "@cosmos-journeyer/universe-model";

export type SystemEntityModel<TContent extends SystemContentModel = SystemContentModel> = {
    id: string;
    name: string;
    content: TContent;
    placement: SystemEntityPlacementModel;
};

export type SystemContentModel<T extends string = string> = {
    type: T;
};

export type SystemEntityPlacementModel = InOrbitPlacementModel | OnSurfacePlacementModel;

export type InOrbitPlacementModel = {
    type: "inOrbit";
    mass: number;
    orbit: Orbit;
    rotation: Rotation;
};

export type OnSurfacePlacementModel = {
    type: "onSurface";
    parentId: OrbitalObjectId;
    position: {
        longitude: number;
        latitude: number;
        heightAboveGround: number;
    };
    rotation: {
        /** 0 = geographic north, +π/2 = east */
        heading: number;
        /** Positive = nose up */
        pitch: number;
        /** Rotation around the forward axis */
        roll: number;
    };
};
