precision highp float;

// based on https://www.shadertoy.com/view/wlcyzj

in vec2 vUV;

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#pragma glslify: camera = require(./utils/camera.glsl)

#pragma glslify: object = require(./utils/object.glsl)

#pragma glslify: uvFromWorld = require(./utils/uvFromWorld.glsl, projection=camera.projection, view=camera.view);
#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView);

#pragma glslify: remap = require(./utils/remap.glsl)

uniform vec3 flareColor;// = vec3(0.643, 0.494, 0.867);
uniform float aspectRatio;

float getSun(vec2 uv){
    return length(uv) < 0.009 ? 1.0 : 0.0;
}

//from: https://www.shadertoy.com/view/XdfXRX
vec3 lensflares(vec2 uv, vec2 pos, out vec3 sunflare, out vec3 lensflare)
{
    vec2 main = uv-pos;
    vec2 uvd = uv*(length(uv));

    float ang = atan(main.y, main.x);
    float dist = length(main);
    dist = pow(dist, 0.1);

    float f0 = 1.0/(length(uv-pos)*25.0+1.0);
    f0 = pow(f0, 2.0);

    f0 = f0+f0*(sin((ang+1.0/18.0)*12.0)*.1+dist*.1+.8);

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

    sunflare = vec3(f0);
    lensflare = vec3(f2+f4+f5+f6, f22+f42+f52+f62, f23+f43+f53+f63);

    return sunflare+lensflare;
}
//



vec3 anflares(vec2 uv, float threshold, float intensity, float stretch, float brightness)
{
    threshold = 1.0 - threshold;

    vec3 hdr = vec3(getSun(uv));
    hdr = vec3(floor(threshold+pow(hdr.r, 1.0)));

    float d = intensity;
    float c = intensity*stretch;

    for (float i=c; i>-1.0; i--){
        float texL = getSun(uv+vec2(i/d, 0.0));
        float texR = getSun(uv-vec2(i/d, 0.0));

        hdr += floor(threshold+pow(max(texL, texR), 4.0))*(1.0-i/c);
    }

    return hdr*brightness;
}





vec3 anflares(vec2 uv, float intensity, float stretch, float brightness)
{
    uv.x *= 1.0/(intensity*stretch);
    uv.y *= 0.5;
    return vec3(smoothstep(0.009, 0.0, length(uv)))*brightness;
}



void main() {
    vec4 screenColor = texture(textureSampler, vUV);

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)
    // actual depth of the scene
    float maximumDistance = length(pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    vec3 rayDir = normalize(pixelWorldPosition - camera.position);
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = camera.position + rayDir * maximumDistance;

    float objectDistance = length(object.position - camera.position);
    vec3 objectDirection = (object.position - camera.position) / objectDistance;

    vec2 objectScreenPos = uvFromWorld(object.position);

    //TODO: resample depth, and test if the object is occluded by something else, then do not render the lens flare
    float depth2 = texture2D(depthSampler, objectScreenPos).r;
    vec3 pixelWorldPosition2 = worldFromUV(objectScreenPos);
    float depthDistance = length((pixelWorldPosition2 - camera.position) * remap(depth2, 0.0, 1.0, camera.near, camera.far));
    if (depthDistance < objectDistance - object.radius) {
        gl_FragColor = screenColor;
        return;
    }

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = vUV - 0.5;
    vec2 mouse = objectScreenPos - 0.5;

    uv.x *= aspectRatio;
    mouse.x *= aspectRatio;

    vec3 col = screenColor.rgb;

    vec3 sun, sunflare, lensflare;
    vec3 flare = lensflares(uv*1.5, mouse*1.5, sunflare, lensflare);

    vec3 anflare = pow(anflares(uv-mouse, 0.5, 400.0, 0.9, 0.1), vec3(4.0));

    sun += getSun(uv-mouse) + (flare + anflare)*flareColor*2.0;

    // no lensflare when looking away from the sun
    sun *= smoothstep(0.0, 0.1, dot(objectDirection, normalize(closestPoint)));

    col += sun;

    // Output to screen
    gl_FragColor = vec4(col, screenColor.a);
}