precision lowp float;

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

#pragma glslify: camera = require(./utils/camera.glsl)

uniform vec3 planetPosition;
uniform float planetRadius;

uniform bool isEnabled;

uniform float aspectRatio;
varying vec2 vUV;

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView);
#pragma glslify: uvFromWorld = require(./utils/uvFromWorld.glsl, projection=camera.projection, view=camera.view);

#pragma glslify: remap = require(./utils/remap.glsl)

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);
    if(!isEnabled) {
        gl_FragColor = screenColor;
        return;
    }

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    if(maximumDistance < camera.far) {
        gl_FragColor = screenColor;
        return;
    }

    vec4 overlayColor = vec4(0.0, 0.0, 0.0, screenColor.a);

    float planetDistance = length(planetPosition - camera.position);
    vec3 planetDirection = (planetPosition - camera.position) / planetDistance;

    if(dot(planetDirection, normalize(closestPoint)) < 0.0) {
        gl_FragColor = screenColor;
        return;
    }

    vec2 uv = uvFromWorld(planetPosition);

    vec2 vUVSquare = vec2(vUV.x * aspectRatio, vUV.y);
    vec2 uvSquare = vec2(uv.x * aspectRatio, uv.y);
    float distance = length(uvSquare - vUVSquare);
    vec2 unitUVSquare = (uvSquare - vUVSquare) / distance;
    
    float limit1 = 0.03 * pow(planetRadius / 1e6, 0.2);
    float limit2 = max(limit1 + 0.005, 0.032 * limit1);

    if(distance >= limit1 && distance <= limit2) {
        float angle = atan(unitUVSquare.y, unitUVSquare.x);
        float angleOff = 0.2;
        float targetAlpha = 1e-3 * planetDistance / planetRadius;
        if((angle > angleOff && angle < 0.5 * 3.14 - angleOff)
        || (angle < -angleOff && angle > -0.5 * 3.14 + angleOff)
        || (angle > 0.5 * 3.14 + angleOff && angle < 3.14 - angleOff)
        || (angle < -0.5 * 3.14 - angleOff && angle > -3.14 + angleOff)) {
            overlayColor.rgb = vec3(targetAlpha);
            overlayColor.rgb = min(overlayColor.rgb, vec3(0.3));
            overlayColor.a = 1.0;
        }
    }
    gl_FragColor = vec4(screenColor.rgb + overlayColor.rgb, overlayColor.a);
}
