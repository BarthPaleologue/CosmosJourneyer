//  This file is part of CosmosJourneyer
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

precision highp float;

/* disable_uniformity_analysis */

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

    // Here, a color test is used and not a depth test
    // You may wonder why. The answer is that using a depth test wouldn't account for the 2D UI and the starfield would be drawn on top of it.
    // In fact the UI has no depth information, so we need to use something else. I chose this color test as it works in practice but it could break.
    // If you have a better idea, please let me know or make a pull request.
    if (screenColor == vec4(0.0)) {
        // get the starfield color
        // get spherical coordinates uv for the starfield texture
        starfieldUV = vec2(
            sign(rayDir.z) * acos(rayDir.x / length(vec2(rayDir.x, rayDir.z))) / 6.28318530718,
            acos(rayDir.y) / 3.14159265359
        );

        vec4 starfieldColor = texture2D(starfieldTexture, starfieldUV);
        starfieldColor.rgb = pow(starfieldColor.rgb, vec3(2.2)); // deeper blacks

        finalColor = vec4(starfieldColor.rgb * visibility, starfieldColor.a);
    }

    gl_FragColor = finalColor;// displaying the final color
}
