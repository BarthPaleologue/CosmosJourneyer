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

import { ManagesLandingPads } from "../utils/managesLandingPads";
import { Cullable } from "../utils/cullable";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../architecture/transformable";
import { Targetable } from "../architecture/targetable";
import { OrbitalObjectType } from "../architecture/orbitalObjectType";
import { OrbitalObjectBase } from "../architecture/orbitalObjectBase";

export interface OrbitalFacilityBase<T extends OrbitalObjectType>
    extends OrbitalObjectBase<T>,
        ManagesLandingPads,
        Cullable,
        Targetable {
    getSubTargets(): Targetable[];

    update(parents: Transformable[], cameraWorldPosition: Vector3, deltaSeconds: number): void;
}
