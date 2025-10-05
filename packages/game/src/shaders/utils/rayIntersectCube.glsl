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

// from https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection

bool rayIntersectCube(vec3 rayOrigin, vec3 rayDir, out float tmax, out float tmin) {
    vec3 min = vec3(-0.5, -0.5, -0.5);
    vec3 max = vec3(0.5, 0.5, 0.5);

    tmin = (min.x - rayOrigin.x) / rayDir.x;
    tmax = (max.x - rayOrigin.x) / rayDir.x;

    if (tmin > tmax) {
        float temp;
        temp = tmin;
        tmin = tmax;
        tmax = temp;
    }

    float tymin = (min.y - rayOrigin.y) / rayDir.y;
    float tymax = (max.y - rayOrigin.y) / rayDir.y;

    if (tymin > tymax) {
        float temp;
        temp = tymin;
        tymin = tymax;
        tymax = temp;
    }

    if ((tmin > tymax) || (tymin > tmax))
    return false;

    if (tymin > tmin)
    tmin = tymin;

    if (tymax < tmax)
    tmax = tymax;

    float tzmin = (min.z - rayOrigin.z) / rayDir.z;
    float tzmax = (max.z - rayOrigin.z) / rayDir.z;

    if (tzmin > tzmax) {
        float temp;
        temp = tzmin;
        tzmin = tzmax;
        tzmax = temp;
    }

    if ((tmin > tzmax) || (tzmin > tmax))
    return false;

    if (tzmin > tmin)
    tmin = tzmin;

    if (tzmax < tmax)
    tmax = tzmax;

    return true;
}