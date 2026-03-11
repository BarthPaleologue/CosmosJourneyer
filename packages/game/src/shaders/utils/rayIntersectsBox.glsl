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

// Returns true when the ray intersects the axis-aligned box.
// `tNear` is the entry distance along the ray, clamped to 0.0 when the ray starts inside the box.
// `tLength` is the distance traveled by the ray while it remains inside the box.
bool rayIntersectsBox(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float tNear, out float tLength) {
    vec3 factors1 = (boxMin - rayOrigin) / rayDir;
    vec3 factors2 = (boxMax - rayOrigin) / rayDir;

    vec3 intersections1 = min(factors1, factors2);
    vec3 intersections2 = max(factors1, factors2);

    float nearIntersection = max(max(max(intersections1.x, intersections1.y), intersections1.z), 0.0);
    float farIntersection = min(min(intersections2.x, intersections2.y), intersections2.z);

    if (farIntersection < nearIntersection) {
        return false;
    }

    tNear = nearIntersection;
    tLength = max(farIntersection - nearIntersection, 0.0);
    return true;
}
