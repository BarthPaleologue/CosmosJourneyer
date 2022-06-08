// https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale, float sharpness, float normalStrength) {
    vec2 uvX = position.zy * scale;
    vec2 uvY = position.xz * scale;
    vec2 uvZ = position.xy * scale;

    vec3 tNormalX = texture2D(normalMap, uvX).rgb;
    vec3 tNormalY = texture2D(normalMap, uvY).rgb;
    vec3 tNormalZ = texture2D(normalMap, uvZ).rgb;

    tNormalX = normalize(tNormalX * 2.0 - 1.0) * normalStrength;
    tNormalY = normalize(tNormalY * 2.0 - 1.0) * normalStrength;
    tNormalZ = normalize(tNormalZ * 2.0 - 1.0) * normalStrength;

    tNormalX = vec3(tNormalX.xy + surfaceNormal.zy, surfaceNormal.x);
    tNormalY = vec3(tNormalY.xy + surfaceNormal.xz, surfaceNormal.y);
    tNormalZ = vec3(tNormalZ.xy + surfaceNormal.xy, surfaceNormal.z);

    vec3 blendWeight = pow(abs(surfaceNormal), vec3(sharpness));
    blendWeight /= dot(blendWeight, vec3(1.0));

    return normalize(tNormalX.zyx * blendWeight.x + tNormalY.xzy * blendWeight.y + tNormalZ.xyz * blendWeight.z);
}

#pragma glslify: export(triplanarNormal)