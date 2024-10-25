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

import { Effect } from "@babylonjs/core/Materials/effect";
import { Transformable } from "../../architecture/transformable";
import { HasBoundingSphere } from "../../architecture/hasBoundingSphere";

export const ObjectUniformNames = {
    OBJECT_POSITION: "object_position",
    OBJECT_RADIUS: "object_radius",
    OBJECT_ROTATION_AXIS: "object_rotationAxis",
    OBJECT_SCALING_DETERMINANT: "object_scaling_determinant"
};

export function setObjectUniforms(effect: Effect, object: Transformable & HasBoundingSphere): void {
    effect.setVector3(ObjectUniformNames.OBJECT_POSITION, object.getTransform().getAbsolutePosition());
    effect.setFloat(ObjectUniformNames.OBJECT_RADIUS, object.getBoundingRadius());
    effect.setVector3(ObjectUniformNames.OBJECT_ROTATION_AXIS, object.getTransform().up);
    effect.setFloat(ObjectUniformNames.OBJECT_SCALING_DETERMINANT, object.getTransform().scalingDeterminant);
}
