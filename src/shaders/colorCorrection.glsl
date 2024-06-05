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

uniform float exposure;
uniform float gamma;
uniform float contrast;
uniform float saturation;
uniform float brightness;

uniform sampler2D textureSampler;
uniform sampler2D glowSampler;

varying vec2 vUV;

#include "./utils/acesTonemap.glsl";

void main() {
    vec3 color = texture2D(textureSampler, vUV).rgb;
    float alpha = texture2D(textureSampler, vUV).a;

    vec3 glow = texture2D(glowSampler, vUV).rgb;

    color += glow;

    color = acesTonemap(color);

    color *= exposure;
    color = clamp(color, 0.0, 1.0);

    color = (color - 0.5) * contrast + 0.5 + brightness;
    color = clamp(color, 0.0, 1.0);

    vec3 grayscale = vec3(0.299, 0.587, 0.114) * color;
    color = mix(grayscale, color, saturation);
    color = clamp(color, 0.0, 1.0);

    color = pow(color, vec3(gamma));

    color = glow;

    gl_FragColor = vec4(color, alpha);
}
