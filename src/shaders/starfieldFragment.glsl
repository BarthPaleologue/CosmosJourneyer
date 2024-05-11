//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

precision lowp float;

varying vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform sampler2D starfieldTexture;// the starfield texture

uniform mat4 starfieldRotation;

#include "./utils/camera.glsl";

uniform float visibility;// visibility of the starfield

#include "./utils/worldFromUV.glsl";

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)

    vec3 rayDir = normalize(pixelWorldPosition - camera_position);// normalized direction of the ray

    rayDir = vec3(starfieldRotation * vec4(rayDir, 1.0));

    vec4 finalColor = screenColor;

    vec2 starfieldUV = vec2(0.0);

    // if the pixel is at the far plane
    if (depth == 1.0) {
        // get the starfield color
        // get spherical coordinates uv for the starfield texture
        starfieldUV = vec2(
        sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
        acos(rayDir.y) / 3.14159265359
        );
    }

    vec4 starfieldColor = texture2D(starfieldTexture, starfieldUV);
    starfieldColor.rgb = pow(starfieldColor.rgb, vec3(2.2));// deeper blacks

    if (depth == 1.0) {
        finalColor = vec4(starfieldColor.rgb * visibility, starfieldColor.a);
    }

    gl_FragColor = finalColor;// displaying the final color
}
