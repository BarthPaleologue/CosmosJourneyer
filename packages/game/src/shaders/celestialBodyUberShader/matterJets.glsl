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

uniform mat4 inverse_rotation;
uniform float dipole_tilt;

const float MATTER_JETS_CONE_HEIGHT = 100.0;
const int MATTER_JETS_RAY_MARCH_STEPS = 100;

float matterJetsSdSpiral(vec3 p, float coneTheta, float frequency) {
    float spiralPos = p.y;
    float radius = spiralPos * tan(coneTheta);
    float theta = frequency * spiralPos;

    vec3 spiralPoint = vec3(
        radius * cos(theta),
        spiralPos,
        radius * sin(theta)
    );

    return length(p - spiralPoint);
}

float matterJetsSpiralDensity(vec3 p, float coneTheta, float coneHeight) {
    float frequency = 0.1;
    float dist = matterJetsSdSpiral(p, coneTheta, frequency);

    float heightFraction = max(abs(p.y) / coneHeight, 1e-4);

    dist /= heightFraction;

    float density = 1.0;

    density *= exp(-0.02 * dist * dist);
    density *= 1.0 - smoothstep(0.0, 1.0, heightFraction);
    density /= heightFraction;

    return density;
}

bool matterJetsRayIntersectCone(
    vec3 rayOrigin,
    vec3 rayDir,
    float coneHeight,
    float cosTheta,
    out float entryDistance,
    out float exitDistance
) {
    vec3 coneUp = vec3(0.0, 1.0, 0.0);

    float cosTheta2 = cosTheta * cosTheta;
    float sinTheta = sqrt(max(0.0, 1.0 - cosTheta2));
    float tanTheta = sinTheta / cosTheta;

    bool inside = false;
    vec3 originToApex = rayOrigin;
    float originHeight = originToApex.y;
    if (originHeight >= 0.0 && originHeight <= coneHeight) {
        float radiusAtHeight = originHeight * tanTheta;
        float radialDistance = length(originToApex - coneUp * originHeight);
        inside = radialDistance <= radiusAtHeight;
    }

    float tCandidates[3];
    int count = 0;

    float a = rayDir.y * rayDir.y - cosTheta2;
    float b = 2.0 * (rayDir.y * rayOrigin.y - dot(rayDir, rayOrigin) * cosTheta2);
    float c = rayOrigin.y * rayOrigin.y - dot(rayOrigin, rayOrigin) * cosTheta2;

    float det = b * b - 4.0 * a * c;
    if (det >= 0.0) {
        float sqrtDet = sqrt(det);
        float t1 = (-b - sqrtDet) / (2.0 * a);
        float t2 = (-b + sqrtDet) / (2.0 * a);

        if (t1 >= 0.0) {
            vec3 p1 = rayOrigin + t1 * rayDir;
            if (p1.y >= 0.0 && p1.y <= coneHeight) {
                tCandidates[count++] = t1;
            }
        }

        if (t2 >= 0.0) {
            vec3 p2 = rayOrigin + t2 * rayDir;
            if (p2.y >= 0.0 && p2.y <= coneHeight) {
                tCandidates[count++] = t2;
            }
        }
    }

    float denom = rayDir.y;
    if (abs(denom) > 1e-6) {
        vec3 baseCenter = coneUp * coneHeight;
        float tBase = (baseCenter - rayOrigin).y / denom;
        if (tBase >= 0.0) {
            vec3 hitPoint = rayOrigin + tBase * rayDir;
            float baseRadius = coneHeight * tanTheta;
            if (length(hitPoint - baseCenter) <= baseRadius) {
                tCandidates[count++] = tBase;
            }
        }
    }

    if (count == 0) {
        return false;
    }

    for (int i = 0; i < count - 1; i++) {
        for (int j = i + 1; j < count; j++) {
            if (tCandidates[j] < tCandidates[i]) {
                float tmp = tCandidates[i];
                tCandidates[i] = tCandidates[j];
                tCandidates[j] = tmp;
            }
        }
    }

    entryDistance = inside ? 0.0 : tCandidates[0];
    exitDistance = count > 1 ? tCandidates[1] : tCandidates[0];

    return exitDistance > entryDistance;
}

vec3 matterJetsRayMarchSpiral(
    vec3 rayOrigin,
    vec3 rayDir,
    float distanceThrough,
    int nbSteps,
    float coneTheta,
    float coneHeight,
    out float transmittance
) {
    vec3 color = vec3(0.0);
    transmittance = 1.0;

    float stepSize = distanceThrough / float(nbSteps);

    for (int i = 0; i < nbSteps; i++) {
        vec3 p = rayOrigin + float(i) * stepSize * rayDir;

        float density = matterJetsSpiralDensity(p, coneTheta * 0.7, coneHeight);

        vec3 emission = 3.0 * vec3(0.3, 0.6, 1.0) * density;
        float absorption = 0.2 * density;

        transmittance *= exp(-absorption * stepSize);
        color += emission * transmittance * stepSize;
    }

    return color;
}

vec3 matterJetsComposeConeSegment(
    vec3 baseColor,
    vec3 rayOriginLocalSpace,
    vec3 rayDirLocalSpace,
    float segmentStart,
    float segmentEnd,
    float scalingFactor
) {
    float coneTheta = dipole_tilt;
    float coneHeight = MATTER_JETS_CONE_HEIGHT;

    float entryDistance;
    float exitDistance;
    if (!matterJetsRayIntersectCone(
        rayOriginLocalSpace,
        rayDirLocalSpace,
        coneHeight,
        cos(coneTheta + sign(coneTheta) * 0.2),
        entryDistance,
        exitDistance
    )) {
        return baseColor;
    }

    float segmentStartLocal = segmentStart / scalingFactor;
    float segmentEndLocal = segmentEnd / scalingFactor;
    float clippedEntryDistance = max(entryDistance, segmentStartLocal);
    float clippedExitDistance = min(exitDistance, segmentEndLocal);

    if (clippedExitDistance <= clippedEntryDistance) {
        return baseColor;
    }

    vec3 startPoint = rayOriginLocalSpace + clippedEntryDistance * rayDirLocalSpace;

    float transmittance;
    vec3 jetColor = matterJetsRayMarchSpiral(
        startPoint,
        rayDirLocalSpace,
        clippedExitDistance - clippedEntryDistance,
        MATTER_JETS_RAY_MARCH_STEPS,
        coneTheta,
        coneHeight,
        transmittance
    );

    return mix(jetColor, baseColor, transmittance);
}

vec3 celestialBodyUberShaderComposeMatterJetsSegment(
    vec3 baseColor,
    vec3 viewDir,
    float segmentStart,
    float segmentEnd
) {
    if (segmentEnd <= segmentStart) {
        return baseColor;
    }

    float scalingFactor = object_radius * 10000.0;

    vec3 rayOriginLocalSpace = mat3(inverse_rotation) * (camera_position - object_position) / scalingFactor;
    vec3 rayDirLocalSpace = mat3(inverse_rotation) * viewDir;

    vec3 color = matterJetsComposeConeSegment(
        baseColor,
        rayOriginLocalSpace,
        rayDirLocalSpace,
        segmentStart,
        segmentEnd,
        scalingFactor
    );

    return matterJetsComposeConeSegment(
        color,
        -rayOriginLocalSpace,
        -rayDirLocalSpace,
        segmentStart,
        segmentEnd,
        scalingFactor
    );
}
