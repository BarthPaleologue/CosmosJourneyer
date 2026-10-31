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

uniform float exposure;
uniform float contrast;
uniform float saturation;

uniform highp sampler2D textureSampler;

varying vec2 vUV;

#include "./utils/tonemapping/acesTonemap.glsl";
#include "./utils/hash12.glsl";

vec3 linearToSRGB(vec3 color) {
    color = clamp(color, 0.0, 1.0);

    vec3 low = 12.92 * color;
    vec3 high = 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055;

    return mix(low, high, step(vec3(0.0031308), color));
}

void main() {
    vec4 texel = texture2D(textureSampler, vUV);
    vec3 color = texel.rgb;

    color *= exposure;

    const float pivot = 0.18;
    color = pivot * pow(
        color / pivot,
        vec3(max(contrast, 0.001))
    );

    float luminance = dot(
        color,
        vec3(0.2126, 0.7152, 0.0722)
    );
    color = mix(vec3(luminance), color, saturation);
    color = max(color, vec3(0.0));
    
    color = acesTonemap(color);

    color = linearToSRGB(color);

    float dither = (hash12(gl_FragCoord.xy) - 0.5) / 255.0;
    color = clamp(color + vec3(dither), 0.0, 1.0);

    gl_FragColor = vec4(color, texel.a);
}
