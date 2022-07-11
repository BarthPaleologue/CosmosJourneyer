float computeSpecularHighLight(vec3 sunDir, vec3 rayDir, vec3 normal, float smoothness, float specularPower) {
    float specularAngle = acos(dot(normalize(sunDir - rayDir), normal));
    float specularExponent = specularAngle / (1.0 - smoothness);

    return exp(-specularExponent * specularExponent) * specularPower;
}

#pragma glslify: export(computeSpecularHighLight)