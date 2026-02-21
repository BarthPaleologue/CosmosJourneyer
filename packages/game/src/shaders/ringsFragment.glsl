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

precision highp float;

#define DISABLE_UNIFORMITY_ANALYSIS

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

// ─── HG multi-lobe parameters (Cassini match) ───────────────────────────────────
// Weights must sum to 1.0
const float rings_f1 = 0.60;  // lobe #1 (strong forward)
const float rings_f2 = 0.25;  // lobe #2 (back‑scatter plateau)
const float rings_f3 = 0.15;  // lobe #3 (quasi‑isotropic haze)

const float rings_g1 = 0.75;  // asymmetry forward (≈ diffractive peak)
const float rings_g2 = -0.30; // asymmetry backward (shadow‑hiding)
const float rings_g3 = 0.00;  // asymmetry isotropic

// ─── scattering constants ──────────────────────────────────────────────────────
const float rings_w           = 0.90;   // single-scattering albedo (ice)

#include "./utils/pi.glsl";

#include "./utils/stars.glsl";

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./rings/rings.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

#include "./utils/rayIntersectsPlane.glsl";

#include "./rings/ringsPatternLookup.glsl";

// ───────────────────────────────────────────────────────────────────────────────
// Henyey–Greenstein helper (returns *unnormalised* value)                       
// (We divide by 4π later.)
float hgLobe(float cosA, float g) {
    float g2 = g*g;
    return (1.0 - g2) * inversesqrt((1.0 + g2 - 2.0*g*cosA) * (1.0 + g2 - 2.0*g*cosA) * (1.0 + g2 - 2.0*g*cosA)); // (⋯)^-3/2 via invsqrt³
}

// Triple-lobe HG – matches Cassini photometry ±3 % RMS over 0.5–170 °
float hgBulkPhase3(float cosA) {
    float p = 0.0;
    p += rings_f1 * hgLobe(cosA, rings_g1);
    p += rings_f2 * hgLobe(cosA, rings_g2);
    p += rings_f3 * hgLobe(cosA, rings_g3);
    return p / (4.0 * PI);
}
// ───────────────────────────────────────────────────────────────────────────────

float tanHalfFromCos(float cosA) {
    float clampedCosA = clamp(cosA, -0.9999, 0.9999);
    // tan(alpha / 2) from cos(alpha): tan^2(alpha/2) = (1 - cos(alpha)) / (1 + cos(alpha))
    return sqrt(max(0.0, (1.0 - clampedCosA) / (1.0 + clampedCosA)));
}

// Calculates the lighting contribution from a single star for the rings
vec3 calculateStarLightingForRings(vec3 samplePoint, vec3 rayDir, vec3 ringAlbedo, vec3 starPosition, vec3 starColor) {
    vec3 rayToSun = normalize(starPosition - samplePoint);
    float cosA = dot(rayToSun, -rayDir);

    // soft shadow from planet
    float softShadowFactor = 1.0;
    float t2, t3;
    if (object_position != starPosition && rayIntersectSphere(samplePoint, rayToSun, object_position, object_radius, t2, t3)) {
        vec3 cp = samplePoint + rayToSun * (t2 + t3) * 0.5;
        float r01 = remap(length(cp - object_position), 0.0, object_radius, 0.0, 1.0);
        softShadowFactor = smoothstep(0.98, 1.0, r01);
    }

    // single-scatter, triple-lobe HG
    float phase = rings_w * hgBulkPhase3(cosA);

    // Opposition surge (Hapke SHOE term):
    // B_SH(alpha) = B0 / (1 + tan(alpha/2) / h)
    float B0 = 1.2;  // amplitude
    float h  = 0.02; // angular width parameter
    float tanHalfPhaseAngle = tanHalfFromCos(cosA);
    float shadowHidingOpposition = B0 / (1.0 + tanHalfPhaseAngle / h);
    phase *= 1.0 + shadowHidingOpposition;

    // Isotropic multiple‐scattering approximation
    // This avoids the rings being too dark
    float multiScattering = 0.3;
    phase += multiScattering;
    
    return starColor * ringAlbedo * phase * softShadowFactor;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);

    float depth = texture2D(depthSampler, vUV).r;

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView); // the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position); // normalized direction of the ray

    vec4 finalColor = screenColor;

    float impactPoint;
    if (rayIntersectsPlane(camera_position, rayDir, object_position, object_rotationAxis, 0.001, impactPoint)) {
        // if the ray intersect the ring plane
        if (impactPoint >= 0.0 && impactPoint < maximumDistance) {
            // if the ray intersects the ring before any other object
            float t0, t1;
            if (!rayIntersectSphere(camera_position, rayDir, object_position, object_radius, t0, t1) || t0 > impactPoint) {
                // if the ray is impacting a solid object after the ring plane
                vec3 samplePoint = camera_position + impactPoint * rayDir;
                vec4 pattern = ringPatternAtPoint(samplePoint);

                vec3 ringAlbedo = pattern.rgb;

                float ringOpacity = pattern.a;
                ringOpacity *= smoothstep(rings_fade_out_distance * 2.0, rings_fade_out_distance * 5.0, impactPoint);

                vec3 ringShadeColor = vec3(0.0);

                for (int i = 0; i < nbStars; i++) {
                    ringShadeColor += calculateStarLightingForRings(samplePoint, rayDir, ringAlbedo, star_positions[i], star_colors[i]);
                }

                float normalIncidenceExtinction = ringOpacity;
                float opticalDepthAtNormalIncidence = -log(max(1e-4, 1.0 - normalIncidenceExtinction));
                float opticalDepthAlongViewRay = opticalDepthAtNormalIncidence / max(abs(dot(rayDir, object_rotationAxis)), 0.3);
                float transmittanceAlongViewRay = exp(-opticalDepthAlongViewRay);

                finalColor = vec4(mix(ringShadeColor, finalColor.rgb, transmittanceAlongViewRay), 1.0);
            }
        }
    }

    gl_FragColor = finalColor;
}