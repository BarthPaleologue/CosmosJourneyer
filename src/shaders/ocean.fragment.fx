precision mediump float;

#define PI 3.1415926535897932
#define POINTS_FROM_CAMERA 10 // number sample points along camera ray
#define OPTICAL_DEPTH_POINTS 10 // number sample points along light ray

// varying
varying vec2 vUV; // screen coordinates

// uniforms
uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera
uniform sampler2D normalMap;

uniform vec3 sunPosition; // position of the sun in world space
uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 projection; // camera's projection matrix
uniform mat4 view; // camera's view matrix
uniform mat4 world;

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space
uniform float oceanRadius; // atmosphere radius (calculate from planet center)

uniform float smoothness;
uniform float specularPower;
uniform float alphaModifier;
uniform float depthModifier;

uniform mat4 planetWorldMatrix;

uniform float time;

// remap a value comprised between low1 and high1 to a value between low2 and high2
float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

// compute the world position of a pixel from its uv coordinates
vec3 worldFromUV(vec2 pos) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, -1.0, 1.0); // get ndc position -1 because i want every point in the near camera plane
    vec4 posVS = inverse(projection) * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverse(view) * vec4((posVS.xyz / posVS.w), 1.0); // then we use inverse view to get to world space, division by w to get actual coordinates
    return posWS.xyz; // the coordinates in world space
}

// returns whether or not a ray hits a sphere, if yes out intersection points
// a good explanation of how it works : https://viclw17.github.io/2018/07/16/raytracing-ray-sphere-intersection/
bool rayIntersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 spherePosition, float sphereRadius, out float t0, out float t1) {
    vec3 relativeOrigin = rayOrigin - spherePosition; // rayOrigin in sphere space

    float a = 1.0;
    float b = 2.0 * dot(relativeOrigin, rayDir);
    float c = dot(relativeOrigin, relativeOrigin) - sphereRadius*sphereRadius;
    
    float d = b*b - 4.0*a*c;

    if(d < 0.0) return false; // no intersection

    float s = sqrt(d);

    float r0 = (-b - s) / (2.0*a);
    float r1 = (-b + s) / (2.0*a);

    t0 = min(r0, r1);
    t1 = max(r0, r1);

    t0 = max(min(r0, r1), 0.0);
    t1 = max(max(r0, r1), 0.0);

    return (t1 > 0.0);
}

vec3 triplanarNormal(vec3 position, vec3 surfaceNormal, sampler2D normalMap, float scale, float sharpness, float normalStrength) {
    vec3 tNormalX = texture2D(normalMap, position.zy * scale).rgb * normalStrength;
    vec3 tNormalY = texture2D(normalMap, position.xz * scale).rgb * normalStrength;
    vec3 tNormalZ = texture2D(normalMap, position.xy * scale).rgb * normalStrength;

    tNormalX = vec3(tNormalX.xy + surfaceNormal.zy, tNormalX.z * surfaceNormal.x);
    tNormalY = vec3(tNormalY.xy + surfaceNormal.xz, tNormalY.z * surfaceNormal.y);
    tNormalZ = vec3(tNormalZ.xy + surfaceNormal.xy, tNormalZ.z * surfaceNormal.z);

    vec3 blendWeight = pow(abs(surfaceNormal), vec3(sharpness));
    blendWeight /= dot(blendWeight, vec3(1.0));

    return normalize(tNormalX.zyx * blendWeight.x + tNormalY.xzy * blendWeight.y + tNormalZ.xyz * blendWeight.z);
}


vec3 lerp(vec3 v1, vec3 v2, float s) {
    return s * v1 + (1.0 - s) * v2;
}

vec3 ocean(vec3 originalColor, vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    float impactPoint, escapePoint;

    float waveAmplitude = 7.0;

    float waveOmega = 1.0/3000.0;

    float actualRadius = oceanRadius + waveAmplitude * sin(time * waveOmega);

    if (!(rayIntersectSphere(rayOrigin, rayDir, planetPosition, actualRadius, impactPoint, escapePoint))) {
        return originalColor; // if not intersecting with atmosphere, return original color
    }

    impactPoint = max(0.0, impactPoint); // cannot be negative (the ray starts where the camera is in such a case)
    escapePoint = min(maximumDistance, escapePoint); // occlusion with other scene objects

    float distanceThroughOcean = max(0.0, escapePoint - impactPoint); // probably doesn't need the max but for the sake of coherence the distance cannot be negative
    
    vec3 samplePoint = rayOrigin + impactPoint * rayDir;

    vec3 samplePointPlanetSpace = vec3(inverse(planetWorldMatrix) * vec4(samplePoint, 1.0));//samplePoint - planetPosition;
    
    vec3 planetNormal = normalize(samplePoint - planetPosition);
    
    vec3 normalWave = triplanarNormal(samplePointPlanetSpace - vec3(time, -time, time), planetNormal, normalMap, 0.00002, 1.0, 0.3);
    normalWave = triplanarNormal(samplePointPlanetSpace - vec3(-time, time, -time), planetNormal, normalMap, 0.00002, 1.0, 0.3);
    
    vec3 sunDir = normalize(sunPosition - planetPosition); // direction to the light source with parallel rays hypothesis

    float ndl = max(dot(planetNormal, sunDir), 0.0); // dimming factor due to light inclination relative to vertex normal in world space

    //TODO : en faire un uniform
    float smoothness = 0.7;
    float specularAngle = acos(dot(normalize(sunDir - rayDir), normalWave));
    float specularExponent = specularAngle / (1.0 - smoothness);
    float specularHighlight = exp(-specularExponent * specularExponent);

    if(distanceThroughOcean > 0.0) {
        float opticalDepth01 = 1.0 - exp(-distanceThroughOcean * depthModifier);

        float alpha = 1.0 - exp(-distanceThroughOcean * alphaModifier);
        
        //vec3 oceanColor = lerp(vec3(10.0, 100.0, 249.0)/255.0, vec3(15.0,94.0,156.0)/255.0, opticalDepth01);
        vec3 deepColor = vec3(0.0, 22.0, 82.0)/255.0;
        vec3 shallowColor = vec3(32.0,193.0,180.0)/255.0;
        vec3 oceanColor = lerp(deepColor, shallowColor, opticalDepth01);
        
        vec3 ambiant = lerp(originalColor, oceanColor, alpha);
 
        return ambiant * ndl + specularHighlight;
    } else {
        return originalColor;
    }
}



void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb; // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec3 finalColor = ocean(screenColor, cameraPosition, rayDir, maximumDistance);

    gl_FragColor = vec4(finalColor, 1.0); // displaying the final color
}