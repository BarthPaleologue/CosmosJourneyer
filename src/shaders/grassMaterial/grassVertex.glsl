precision highp float;

attribute vec3 position;
attribute vec3 normal;

uniform mat4 view;
uniform mat4 projection;

uniform vec3 cameraPosition;
uniform vec3 playerPosition;

uniform float time;

uniform sampler2D perlinNoise;

varying vec3 vPosition;

varying mat4 normalMatrix;
varying vec3 vNormal;

// rotation using https://www.wikiwand.com/en/Rodrigues%27_rotation_formula
vec3 rotateAround(vec3 vector, vec3 axis, float theta) {
    // Please note that unit vector are required, i did not divided by the norms
    return cos(theta) * vector + cross(axis, vector) * sin(theta) + axis * dot(axis, vector) * (1.0 - cos(theta));
}

float easeOut(float t, float a) {
    return 1.0 - pow(1.0 - t, a);
}

float easeIn(float t, float alpha) {
    return pow(t, alpha);
}

#pragma glslify: remap = require(./remap.glsl)

#include<instancesDeclaration>

void main() {
    #include<instancesVertex>

    // wind
    vec3 objectWorld = world3.xyz;
    float windStrength = texture2D(perlinNoise, objectWorld.xz * 0.007 + 0.1 * time).r;
    float windDir = texture2D(perlinNoise, objectWorld.xz * 0.005 + 0.05 * time).r * 2.0 * 3.14;

    float windLeanAngle = remap(windStrength, 0.0, 1.0, 0.25, 1.0);
    windLeanAngle = easeIn(windLeanAngle, 2.0) * 0.75;

    // curved grass blade
    float leanAmount = 0.3;
    float curveAmount = leanAmount * position.y;
    float objectDistance = length(objectWorld - playerPosition);

    // account for player presence
    vec3 playerDirection = (objectWorld - playerPosition) / objectDistance;
    float maxDistance = 3.0;
    float distance01 = objectDistance / maxDistance;
    float influence = 1.0 + 8.0 * smoothstep(0.0, 1.0, 1.0 - distance01);
    curveAmount *= influence;
    curveAmount += windLeanAngle * smoothstep(0.2, 1.0, distance01);

    vec3 leanAxis = rotateAround(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), windDir * smoothstep(0.2, 1.0, distance01));
    leanAxis = normalize(mix(cross(vec3(0.0, 1.0, 0.0), playerDirection), leanAxis, smoothstep(0.0, 1.0, 1.0 - distance01)));


    vec3 leaningPosition = rotateAround(position, leanAxis, curveAmount);

    vec3 leaningNormal = rotateAround(normal, leanAxis, curveAmount);

    vec4 worldPosition = finalWorld * vec4(leaningPosition, 1.0);


    //vec3 viewDir = normalize(cameraPosition - worldPosition);
    //float viewDotNormal = abs(dot(viewDir, leaningNormal));
    //float viewSpaceThickenFactor = easeOut(1.0 - viewDotNormal, 4.0);

    //viewSpaceThickenFactor *= smoothstep(0.0, 0.2, viewDotNormal);

    vec4 viewPosition = view * worldPosition;
    //viewPosition.x += viewSpaceThickenFactor * leaningNormal.y;

    vec4 outPosition = projection * viewPosition;
    gl_Position = outPosition;

    vPosition = position;

    normalMatrix = transpose(inverse(finalWorld));

    vNormal = leaningNormal;
}