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

varying vec2 vUV;

uniform sampler2D textureSampler;
uniform sampler2D sceneSampler;

void main() {
    vec3 sceneColor = texture2D(sceneSampler, vUV).rgb;
    vec4 fogData = texture2D(textureSampler, vUV);

    vec3 finalColor = sceneColor * fogData.a + fogData.rgb;
    gl_FragColor = vec4(finalColor, 1.0);
}
