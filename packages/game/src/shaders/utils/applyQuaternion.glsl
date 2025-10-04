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

vec3 applyQuaternion(vec4 quaternion, vec3 vector) {
    float qx = quaternion.x;
    float qy = quaternion.y;
    float qz = quaternion.z;
    float qw = quaternion.w;
    float x = vector.x;
    float y = vector.y;
    float z = vector.z;
    // apply quaternion to vector
    float ix = qw * x + qy * z - qz * y;
    float iy = qw * y + qz * x - qx * z;
    float iz = qw * z + qx * y - qy * x;
    float iw = -qx * x - qy * y - qz * z;
    // calculate result * inverse quat
    float nX = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    float nY = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    float nZ = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return vec3(nX, nY, nZ);
}