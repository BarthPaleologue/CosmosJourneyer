precision highp float;

// based on https://www.shadertoy.com/view/wlcyzj

varying vec2 vUV;

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

uniform float visibility;
uniform vec3 clipPosition;
uniform float frontDepth;
uniform vec2 screenRadius;

#include "./utils/camera.glsl";

#include "./utils/object.glsl";

#include "./utils/worldFromUV.glsl";

#include "./utils/rayIntersectSphere.glsl";

uniform vec3 flareColor;
uniform float aspectRatio;

float projectDepth(vec3 worldPosition) {
    vec4 clip = camera_projection * camera_view * vec4(worldPosition, 1.0);
#ifdef USE_REVERSE_DEPTHBUFFER
    return (-clip.z + camera_near) / (camera_near + camera_far);
#else
    return (clip.z + camera_near) / (camera_near + camera_far);
#endif
}

float sampleVisibilityAtUV(vec2 sampleUV, float depthEpsilon) {
    vec3 sampleWorldPosition = worldFromUV(sampleUV, camera_inverseProjection, camera_inverseView);
    vec3 sampleRay = normalize(sampleWorldPosition - camera_position);
    float sphereEnterDistance;
    float sphereExitDistance;
    if (!rayIntersectSphere(
        camera_position,
        sampleRay,
        object_position,
        object_radius,
        sphereEnterDistance,
        sphereExitDistance
    )) {
        return 1.0;
    }

    float sampleDepth = texture(depthSampler, sampleUV).r;
    if (sampleDepth >= 0.9999) {
        return 1.0;
    }

    float sphereHitDistance = max(sphereEnterDistance, 0.0);
    vec3 sphereHitPosition = camera_position + sampleRay * sphereHitDistance;
    float sphereHitDepth = projectDepth(sphereHitPosition);
#ifdef USE_REVERSE_DEPTHBUFFER
    return sampleDepth < sphereHitDepth - depthEpsilon ? 0.0 : 1.0;
#else
    return sampleDepth > sphereHitDepth + depthEpsilon ? 0.0 : 1.0;
#endif
}

float computeOcclusionVisibility() {
    vec2 centerUV = vec2(clipPosition.x, 1.0 - clipPosition.y);
    vec2 radius = max(screenRadius, vec2(0.0));
    float maxRadius = max(radius.x, radius.y);
    if (maxRadius <= 0.0) {
        return 1.0;
    }

    vec2 innerRadius = radius * 0.4;
    vec2 outerRadius = radius * 0.8;
    float depthEpsilon = max(abs(frontDepth - clipPosition.z) * 2.0, 0.0025);
    vec2 sampleOffsets[13];
    sampleOffsets[0] = vec2(0.0);
    sampleOffsets[1] = vec2(-innerRadius.x, 0.0);
    sampleOffsets[2] = vec2(innerRadius.x, 0.0);
    sampleOffsets[3] = vec2(0.0, -innerRadius.y);
    sampleOffsets[4] = vec2(0.0, innerRadius.y);
    sampleOffsets[5] = vec2(-innerRadius.x, -innerRadius.y);
    sampleOffsets[6] = vec2(innerRadius.x, -innerRadius.y);
    sampleOffsets[7] = vec2(-innerRadius.x, innerRadius.y);
    sampleOffsets[8] = vec2(innerRadius.x, innerRadius.y);
    sampleOffsets[9] = vec2(-outerRadius.x, 0.0);
    sampleOffsets[10] = vec2(outerRadius.x, 0.0);
    sampleOffsets[11] = vec2(0.0, -outerRadius.y);
    sampleOffsets[12] = vec2(0.0, outerRadius.y);

    float visibleSampleCount = 0.0;
    for (int i = 0; i < 13; i++) {
        vec2 sampleUV = centerUV + sampleOffsets[i];
        float sampleVisibility = sampleVisibilityAtUV(sampleUV, depthEpsilon);
        visibleSampleCount += sampleVisibility;
    }

    return visibleSampleCount / 13.0;
}

float getSun(vec2 uv){
    return length(uv) < 0.009 ? 1.0 : 0.0;
}

//from: https://www.shadertoy.com/view/XdfXRX
vec3 lensflares(vec2 uv, vec2 pos, float fadeOut)
{
    vec2 main = uv-pos;
    vec2 uvd = uv*(length(uv));

    float ang = atan(main.y, main.x);
    float dist = length(main);
    dist = pow(dist, 0.1);

    float f0 = 1.0/(length(uv-pos)*25.0+1.0);
    f0 = pow(f0, 2.0);

    f0 = f0+f0*(sin((ang+1.0/18.0)*12.0)*.1+dist*.1+.8);

    f0 *= fadeOut;

    float f2 = max(1.0/(1.0+32.0*pow(length(uvd+0.8*pos), 2.0)), .0)*00.25;
    float f22 = max(1.0/(1.0+32.0*pow(length(uvd+0.85*pos), 2.0)), .0)*00.23;
    float f23 = max(1.0/(1.0+32.0*pow(length(uvd+0.9*pos), 2.0)), .0)*00.21;

    vec2 uvx = mix(uv, uvd, -0.5);

    float f4 = max(0.01-pow(length(uvx+0.4*pos), 2.4), .0)*6.0;
    float f42 = max(0.01-pow(length(uvx+0.45*pos), 2.4), .0)*5.0;
    float f43 = max(0.01-pow(length(uvx+0.5*pos), 2.4), .0)*3.0;

    uvx = mix(uv, uvd, -.4);

    float f5 = max(0.01-pow(length(uvx+0.2*pos), 5.5), .0)*2.0;
    float f52 = max(0.01-pow(length(uvx+0.4*pos), 5.5), .0)*2.0;
    float f53 = max(0.01-pow(length(uvx+0.6*pos), 5.5), .0)*2.0;

    uvx = mix(uv, uvd, -0.5);

    float f6 = max(0.01-pow(length(uvx-0.3*pos), 1.6), .0)*6.0;
    float f62 = max(0.01-pow(length(uvx-0.325*pos), 1.6), .0)*3.0;
    float f63 = max(0.01-pow(length(uvx-0.35*pos), 1.6), .0)*5.0;

    vec3 sunflare = vec3(f0);
    vec3 lensflare = vec3(f2+f4+f5+f6, f22+f42+f52+f62, f23+f43+f53+f63);

    return sunflare+lensflare;
}


// based on https://www.shadertoy.com/view/XsGfWV
/*vec3 anflares(vec2 uv, float threshold, float intensity, float stretch, float brightness, float fadeOut)
{
    threshold = 1.0 - threshold;

    vec3 hdr = vec3(getSun(uv));
    hdr = vec3(floor(threshold+pow(hdr.r, 1.0)));

    float d = intensity * fadeOut;
    float c = intensity * stretch;

    for (float i=c; i>-1.0; i--){
        float texL = getSun(uv+vec2(i/d, 0.0));
        float texR = getSun(uv-vec2(i/d, 0.0));

        hdr += floor(threshold+pow(max(texL, texR), 4.0))*(1.0-i/c);
    }

    return hdr*brightness;
}*/


vec3 anflares(vec2 uv, float intensity, float stretch, float brightness)
{
    uv.x *= 1.0/(intensity*stretch);
    uv.y *= 0.5;
    return vec3(1.0 - smoothstep(0.0, 0.009, length(uv)))*brightness;
}

void main() {
    vec4 screenColor = texture(textureSampler, vUV);

    if (visibility == 0.0) {
        gl_FragColor = screenColor;
        return;
    }

    vec3 pixelWorldPosition = worldFromUV(vUV, camera_inverseProjection, camera_inverseView);// the pixel position in world space (near plane)
    vec3 rayDir = normalize(pixelWorldPosition - camera_position);

    vec3 objectDirection = normalize(object_position - camera_position);

    vec2 objectScreenPos = clipPosition.xy;
    objectScreenPos.y = 1.0 - objectScreenPos.y;

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = vUV - 0.5;
    vec2 mouse = objectScreenPos - 0.5;

    uv.x *= aspectRatio;
    mouse.x *= aspectRatio;

    vec3 col = screenColor.rgb;

    // if angular radius is to great, fade the anflare out
    float angularRadius = object_radius / length(object_position - camera_position);
    float fadeOut = 1.0 - smoothstep(0.0, 0.1, angularRadius);

    vec3 flare = lensflares(uv*1.5, mouse*1.5, fadeOut);

    vec3 anflare = pow(anflares(uv-mouse, 400.0, 0.5, 0.6) * fadeOut, vec3(4.0));
    anflare += smoothstep(0.0025, 1.0, anflare)*10.0;
    anflare *= smoothstep(0.0, 1.0, anflare);

    //vec3 anflare = pow(anflares(uv-mouse, 0.5, 400.0, 0.9, 0.1), vec3(4.0));

    vec3 sun = getSun(uv-mouse) * fadeOut + (flare + anflare)*flareColor*2.0;

    // no lensflare when looking away from the sun
    sun *= smoothstep(0.0, 0.1, dot(objectDirection, rayDir));

    col += sun * visibility * computeOcclusionVisibility();

    // Output to screen
    gl_FragColor = vec4(col, screenColor.a);
}
