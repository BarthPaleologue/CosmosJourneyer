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

import { type AsteroidField } from "@/frontend/universe/asteroidFields/asteroidField";

export function distanceToAsteroidField(position: Vector3, asteroidField: AsteroidField) {
    const celestialBody = asteroidField.parent;
    const celestialBodyPosition = celestialBody.position;

    const relativePosition = position.subtract(celestialBodyPosition);
    const distanceAboveRings = Math.abs(Vector3.Dot(relativePosition, celestialBody.up));
    const planarDistance = relativePosition.subtract(celestialBody.up.scale(distanceAboveRings)).length();

    const ringsMinDistance = asteroidField.innerRadius;
    const ringsMaxDistance = asteroidField.outerRadius;

    const isAboveRings = planarDistance > ringsMinDistance && planarDistance < ringsMaxDistance;

    return isAboveRings
        ? Math.abs(distanceAboveRings)
        : Math.sqrt(
              Math.min((planarDistance - ringsMinDistance) ** 2, (planarDistance - ringsMaxDistance) ** 2) +
                  distanceAboveRings ** 2,
          );
}
