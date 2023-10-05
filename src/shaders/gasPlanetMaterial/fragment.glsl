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

uniform mat4 world;

uniform vec3 playerPosition; // camera position in world space

#define MAX_STARS 5
uniform vec3 starPositions[MAX_STARS]; // positions of the stars in world space
uniform int nbStars; // number of stars

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
    vec3 viewRayW = normalize(playerPosition - vPositionW); // view direction in world space

    vec3 sphereNormalW = vSphereNormalW;
    vec3 normalW = vNormalW;

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

    vec3 color = vec3(0.0);

    if(ndl > 0.0) {
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

    gl_FragColor = vec4(screenColor, 1.0); // apply color and lighting
    #ifdef LOGARITHMICDEPTH
    gl_FragDepthEXT = log2(vFragmentDepth) * logarithmicDepthConstant * 0.5;
    #endif
}
