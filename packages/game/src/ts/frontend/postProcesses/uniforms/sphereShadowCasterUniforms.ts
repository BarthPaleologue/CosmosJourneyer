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

import { type Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

export const maxShadowCastingSpheres = 8;

export type SphereShadowCaster = Transformable & HasBoundingSphere;

export const SphereShadowCasterUniformNames = {
    SHADOW_CASTING_SPHERE_COUNT: "shadowCastingSphereCount",
    SHADOW_CASTING_SPHERES: "shadowCastingSpheres",
} as const;

const shadowCastingSpheres = new Float32Array(maxShadowCastingSpheres * 4);
const tempPosition = new Vector3();

export function setSphereShadowCasterUniforms(
    effect: Effect,
    shadowCasters: ReadonlyArray<SphereShadowCaster>,
    floatingOriginOffset: Vector3,
): void {
    let shadowCasterCount = 0;
    for (const shadowCaster of shadowCasters) {
        shadowCaster.getTransform().getAbsolutePosition().subtractToRef(floatingOriginOffset, tempPosition);
        if (tempPosition.lengthSquared() > 5_000_000e3 ** 2) {
            continue;
        }

        shadowCastingSpheres[shadowCasterCount * 4] = tempPosition.x;
        shadowCastingSpheres[shadowCasterCount * 4 + 1] = tempPosition.y;
        shadowCastingSpheres[shadowCasterCount * 4 + 2] = tempPosition.z;
        shadowCastingSpheres[shadowCasterCount * 4 + 3] = shadowCaster.getBoundingRadius();

        shadowCasterCount++;
        if (shadowCasterCount >= maxShadowCastingSpheres) {
            break;
        }
    }

    effect.setInt(SphereShadowCasterUniformNames.SHADOW_CASTING_SPHERE_COUNT, shadowCasterCount);
    effect.setFloatArray4(SphereShadowCasterUniformNames.SHADOW_CASTING_SPHERES, shadowCastingSpheres);
}
