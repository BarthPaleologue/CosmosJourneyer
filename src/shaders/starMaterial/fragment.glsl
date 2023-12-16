precision highp float;

varying vec3 vPosition;// position of the vertex varyingsphere space
varying vec3 vUnitSamplePoint;

uniform vec3 starColor;
uniform float time;

uniform float seed;

uniform sampler2D lut;

#include "../utils/rotateAround.glsl";

#include "../utils/toUV.glsl";

void main() {
    float plasmaSpeed = 0.005;
    vec3 samplePoint1 = rotateAround(vUnitSamplePoint, vec3(0.0, 1.0, 0.0), time * plasmaSpeed);
    vec3 samplePoint2 = rotateAround(vUnitSamplePoint, vec3(0.0, 1.0, 0.0), -time * plasmaSpeed);

    vec2 uv1 = toUV(samplePoint1);
    vec2 df1 = fwidth(uv1);
    if(df1.x > 0.5) df1.x = 0.0;

    vec2 uv2 = toUV(samplePoint2);
    vec2 df2 = fwidth(uv2);
    if(df2.x > 0.5) df2.x = 0.0;

    float noiseValue1 = textureLod(lut, uv1, log2(max(df1.x, df1.y) * 1024.0)).r;
    float noiseValue2 = textureLod(lut, uv2, log2(max(df2.x, df2.y) * 1024.0)).r;

    float noiseValue = noiseValue1 * noiseValue2;

    vec3 finalColor = starColor;

    finalColor -= vec3(pow(noiseValue, 4.0));

    gl_FragColor = vec4(finalColor, 1.0);// apply color and lighting
} 