precision lowp float;

#ifdef LOGARITHMICDEPTH
uniform float logarithmicDepthConstant;
varying float vFragmentDepth;
#endif

varying vec3 vPositionW;
varying vec3 vNormalW;
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;

varying vec3 vPosition; // position of the vertex in sphere space
varying vec3 vNormal; // normal of the vertex in sphere space

uniform mat4 world;

uniform vec3 playerPosition; // camera position in world space

uniform vec3 planetPosition;

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform vec3 color4;
uniform float colorSharpness;

uniform float time;

uniform float seed;

uniform float planetRadius;

#pragma glslify: fractalSimplex4 = require(../utils/simplex4.glsl)

#pragma glslify: fastAcos = require(../utils/fastAcos.glsl)

#pragma glslify: remap = require(../utils/remap.glsl)

#pragma glslify: lerp = require(../utils/vec3Lerp.glsl)

#pragma glslify: saturate = require(../utils/saturate.glsl)

#pragma glslify: smoothSharpener = require(../utils/smoothSharpener.glsl)

#pragma glslify: rotateAround = require(../utils/rotateAround.glsl)


void main() {
    vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space

    vec3 sphereNormalW = vSphereNormalW;
    vec3 normal = vNormal;
    vec3 normalW = normalize(vec3(world * vec4(normal, 0.0)));

    float ndl = 0.0;
    float specComp = 0.0;
    for(int i = 0; i < nbStars; i++) {
        vec3 starLightRayW = normalize(starPositions[i] - vPositionW); // light ray direction in world space
        ndl += max(0.0, dot(sphereNormalW, starLightRayW));

        vec3 angleW = normalize(viewRayW + starLightRayW);
        specComp += max(0.0, dot(normalW, angleW));
    }
    ndl = saturate(ndl);
    specComp = saturate(specComp);
    specComp = pow(specComp, 128.0);

    // TODO: finish this (uniforms...)
    /*float smoothness = 0.7;
    float specularAngle = fastAcos(dot(normalize(viewRayW + lightRayW), normalW));
    float specularExponent = specularAngle / (1.0 - smoothness);
    float specComp = exp(-specularExponent * specularExponent);*/

    vec3 color = vec3(0.0);

    if(ndl > 0.0) {
        vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, mod(seed, 1e3));

        seededSamplePoint.y *= 2.5;

        float cloudSpeed = 0.005;
        float offsetAmplitude = 0.0;

        float warpStrength = 4.0;

        int nbOctaves = 3;

        vec3 qOffset1 = vec3(0.0) + offsetAmplitude * vec3(cos(0.5 + time*cloudSpeed), 0.0, sin(time*cloudSpeed));
        vec3 qOffset2 = vec3(13.0, 37.0, -73.0) + offsetAmplitude * vec3(cos(time*cloudSpeed), 0.0, sin(2.1 + time*cloudSpeed));
        vec3 qOffset3 = vec3(-56.0, 19.0, 47.0) + offsetAmplitude * vec3(cos(4.0 + time*cloudSpeed), 0.0, sin(time*cloudSpeed));
        vec4 q = vec4(
            fractalSimplex4(seededSamplePoint + vec4(qOffset1, 0.0), nbOctaves, 2.0, 2.0),
            fractalSimplex4(seededSamplePoint + vec4(qOffset2, 0.0), nbOctaves, 2.0, 2.0),
            fractalSimplex4(seededSamplePoint + vec4(qOffset3, 0.0), nbOctaves, 2.0, 2.0),
            0.0
        );

        vec3 rOffset1 = vec3(21.0, -16.0, 7.0) + offsetAmplitude * vec3(cos(0.5 + time*cloudSpeed), 0.0, sin(time*cloudSpeed));
        vec3 rOffset2 = vec3(-5.0, 3.0, 12.0) + offsetAmplitude * vec3(cos(time*cloudSpeed), 0.0, sin(2.1 + time*cloudSpeed));
        vec3 rOffset3 = vec3(9.0, -1.0, 13.0) + offsetAmplitude * vec3(cos(4.0 + time*cloudSpeed), 0.0, sin(time*cloudSpeed));
        vec4 r = vec4(
            fractalSimplex4(seededSamplePoint + warpStrength * q + vec4(rOffset1, 0.0), nbOctaves, 2.0, 2.0),
            fractalSimplex4(seededSamplePoint + warpStrength * q + vec4(rOffset2, 0.0), nbOctaves, 2.0, 2.0),
            fractalSimplex4(seededSamplePoint + warpStrength * q + vec4(rOffset3, 0.0), nbOctaves, 2.0, 2.0),
            0.0
        );
        //r = vec4(rotateAround(r.xyz, vec3(0.0, 1.0, 0.0), time * cloudSpeed), r.w);
        //r.xyz += vec3(cos(time * 0.02), 0.0, sin(time * 0.02));

        seededSamplePoint += q + warpStrength * r;
        
        //float colorSharpness = 1.5;

        float sep1 = smoothSharpener(abs(r.x), colorSharpness);
        float sep2 = smoothSharpener(abs(q.x), colorSharpness);
        float sep3 = smoothSharpener(abs(r.y), colorSharpness);

        color = lerp(color1, color2, sep1);
        color = lerp(color, color3, sep2);
        color = lerp(color, color4, sep3);

        color = min(color * 1.2, vec3(1.0));
    }

    specComp /= 2.0;

    vec3 screenColor = color.rgb * (ndl + specComp * ndl);

    gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting
    #ifdef LOGARITHMICDEPTH
    gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
}