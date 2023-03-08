float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 stochasticSample(vec2 uv, float seed) {
    float jitter = rand(uv + seed) * 0.01;
    return uv + vec2(jitter, jitter);
}

// https://bgolus.medium.com/normal-mapping-for-a-triplanar-shader-10bf39dca05a
vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale, float sharpness, float normalStrength) {
    vec2 uvX = position.zy * scale;
    vec2 uvY = position.xz * scale;
    vec2 uvZ = position.xy * scale;

    // each uv is the result of a blending between 3 stochastic samples
    /*vec2 uvX = vec2(0.0);
    vec2 uvY = vec2(0.0);
    vec2 uvZ = vec2(0.0);

    for (int i = 0; i < 3; i++) {
        float seed = float(i) * 0.1;
        uvX += stochasticSample(position.zy * scale, seed);
        uvY += stochasticSample(position.xz * scale, seed);
        uvZ += stochasticSample(position.xy * scale, seed);
    }

    uvX /= 3.0;
    uvY /= 3.0;
    uvZ /= 3.0;*/

    // get the normal from the normal map

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