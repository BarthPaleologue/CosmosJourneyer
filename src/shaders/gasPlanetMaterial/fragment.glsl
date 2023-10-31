precision highp float;

#define MAX_STARS 5
uniform int nbStars;// number of stars
struct Star {
    vec3 position;
    vec3 color;
};
uniform Star stars[MAX_STARS];

in vec3 vPositionW;
in vec3 vNormalW;
in vec3 vUnitSamplePoint;

in vec3 vPosition;// position of the vertex in sphere space

uniform vec3 playerPosition;// camera position in world space

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float colorSharpness;

uniform float time;

uniform float seed;

#pragma glslify: fractalSimplex4 = require(../utils/simplex4.glsl)

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

#pragma glslify: saturate = require(../utils/saturate.glsl)

#pragma glslify: smoothSharpener = require(../utils/smoothSharpener.glsl)

void main() {
    vec3 viewRayW = normalize(playerPosition - vPositionW);// view direction in world space

    vec3 normalW = vNormalW;

    vec3 ndl = vec3(0.0);
    float specComp = 0.0;
    for (int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(stars[i].position - vPositionW);// light ray direction in world space
        ndl += max(0.0, dot(normalW, starLightRayW)) * stars[i].color;// diffuse lighting

        vec3 angleW = normalize(viewRayW + starLightRayW);
        specComp += max(0.0, dot(normalW, angleW));
    }
    ndl = clamp(ndl, 0.0, 1.0);
    specComp = saturate(specComp);
    specComp = pow(specComp, 128.0);

    vec3 color = vec3(0.0);

    if (ndl.x > 0.0 || ndl.y > 0.0 || ndl.z > 0.0) {
        vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, mod(seed, 1e3));

        seededSamplePoint.y *= 2.5;

        float latitude = seededSamplePoint.y;

        float seedImpact = mod(seed, 1e3);

        float warpingStrength = 2.0;
        float warping = fractalSimplex4(seededSamplePoint + vec4(seedImpact, 0.0, 0.0, time * 0.0001), 5, 2.0, 2.0) * warpingStrength;

        float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

        float colorDecision2 = fractalSimplex4(vec4(latitude - warping, seedImpact, -seedImpact, seedImpact), 3, 2.0, 2.0);

        color = lerp(color1, color2, smoothstep(0.4, 0.6, colorDecision1));

        color = lerp(color, color3, smoothSharpener(colorDecision2, colorSharpness));
    }

    specComp /= 2.0;

    vec3 screenColor = color.rgb * (ndl + specComp * ndl);

    gl_FragColor = vec4(screenColor, 1.0);// apply color and lighting
}
