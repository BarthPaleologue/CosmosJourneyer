precision highp float;

uniform float time;

uniform vec3 lightDirection;

varying vec3 vPosition;

varying mat4 normalMatrix;
varying vec3 vNormal;

void main() {
    vec3 baseColor = vec3(0.05, 0.2, 0.01);
    vec3 tipColor = vec3(0.5, 0.5, 0.1);

    vec3 finalColor = mix(baseColor, tipColor, pow(vPosition.y, 4.0));

    vec3 normalW = normalize((normalMatrix * vec4(vNormal, 0.0)).xyz);

    float ndl1 = max(dot(normalW, lightDirection), 0.0);
    float ndl2 = max(dot(-normalW, lightDirection), 0.0);
    float ndl = ndl1 + ndl2;

    // ambient lighting
    ndl = clamp(ndl + 0.1, 0.0, 1.0);

    float density = 0.2;
    float aoForDensity = mix(1.0, 0.25, density);
    float ao = mix(aoForDensity, 1.0, pow(vPosition.y, 2.0));

    gl_FragColor = vec4(finalColor * ndl * ao, 1.0);// apply color and lighting
} 