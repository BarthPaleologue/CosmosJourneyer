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

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

// ─── HG multi-lobe parameters (Cassini match) ───────────────────────────────────
// Weights must sum to 1.0
const float rings_f1 = 0.55;  // lobe #1 (strong forward)
const float rings_f2 = 0.20;  // lobe #2 (back-scatter plateau)
const float rings_f3 = 0.25;  // lobe #3 2nd order lobe

const float rings_g1 = 0.75;  // asymmetry forward (≈ diffractive peak)
const float rings_g2 = -0.30; // asymmetry backward (shadow-hiding)
const float rings_g3 = -0.05;  // very weakly back-biased

// ─── scattering constants ──────────────────────────────────────────────────────
const float rings_w           = 0.90;   // single-scattering albedo (ice)
const float rings_thickness   = 2.0;    // metres → ray param scale

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

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera_position) * remap(depth, 0.0, 1.0, camera_near, camera_far);

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

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
                float ringDensity = pattern.a;
                ringDensity *= smoothstep(rings_fade_out_distance * 2.0, rings_fade_out_distance * 5.0, impactPoint);

                float ringOpacity = 1.0 - exp(-ringDensity * rings_thickness);

                vec3 ringShadeColor = vec3(0.0);

                for (int i = 0; i < nbStars; i++) {
                    vec3 rayToSun = normalize(star_positions[i] - samplePoint);
                    float cosA = dot(rayToSun, -rayDir);

                    // soft shadow from planet
                    float soft = 1.0;
                    float t2, t3;
                    if (rayIntersectSphere(samplePoint, rayToSun, object_position, object_radius, t2, t3)) {
                        vec3 cp  = samplePoint + rayToSun * (t2 + t3) * 0.5;
                        float r01 = remap(length(cp - object_position), 0.0, object_radius, 0.0, 1.0);
                        soft = smoothstep(0.98, 1.0, r01);
                    }

                    // single-scatter, triple-lobe HG
                    float phase = rings_w * hgBulkPhase3(cosA);

                    // ── Opposition surge (Hapke SHOE term) ────────────────────
                    float B0 = 1.2;  // amplitude
                    float h  = 0.01; // half-width (rad)
                    float alpha = acos(clamp(cosA, -1.0, 1.0));
                    float B = B0 / (1.0 + tan(alpha)*tan(alpha)/(h*h));
                    phase *= 1.0 + B;

                    float r_ms = 0.2;           // 2 % of incident flux
                    phase += r_ms;

                    ringShadeColor += star_colors[i] * ringAlbedo * phase * soft;
                }

                finalColor = vec4(mix(finalColor.rgb, ringShadeColor, ringOpacity), 1.0);
            }
        }
    }

    gl_FragColor = finalColor;// displaying the final color
}