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

// returns whether or not a ray hits a sphere, if yes out intersection points
// a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
bool lineIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 relativeOrigin = rayOrigin - spherePosition;// rayOrigin in sphere space

    float a = 1.0;
    float b = 2.0 * dot(relativeOrigin, rayDir);
    float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;

    float d = b*b - 4.0*a*c;

    if (d < 0.0) return false;// no intersection

    float s = sqrt(d);

    float r0 = (-b - s) / (2.0*a);
    float r1 = (-b + s) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    return true;
}