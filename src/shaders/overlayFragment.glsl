precision lowp float;

#define MAX_PLANETS 10
uniform vec4 planetPositions[MAX_PLANETS];
uniform int nbPlanets; // number of stars

uniform sampler2D textureSampler;
uniform sampler2D depthSampler;

uniform mat4 view;
uniform mat4 projection;

uniform float cameraNear;
uniform float cameraFar;
uniform vec3 cameraPosition;
uniform vec3 cameraDirection;

uniform bool isEnabled;

uniform float aspectRatio;
varying vec2 vUV;

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, projection=projection, view=view);
#pragma glslify: uvFromWorld = require(./utils/uvFromWorld.glsl, projection=projection, view=view);

#pragma glslify: remap = require(./utils/remap.glsl)

void main() {
    vec3 screenColor = texture2D(textureSampler, vUV).rgb;
    if(!isEnabled) {
        gl_FragColor = vec4(screenColor, 1.0);
        return;
    }

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)
    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    if(maximumDistance < cameraFar) {
        gl_FragColor = vec4(screenColor, 1.0);
        return;
    }

    vec3 overlayColor = vec3(0.0);

    for(int i = 0; i < nbPlanets; i++) {
        vec3 planetPosition = planetPositions[i].xyz;

        float planetRadius = planetPositions[i].w * 1.5;
        float planetDistance = length(planetPosition - cameraPosition);
        vec3 planetDirection = (planetPosition - cameraPosition) / planetDistance;

        if(dot(planetDirection, cameraDirection) < 0.0) continue;

        vec2 uv = uvFromWorld(planetPosition);

        vec2 vUVSquare = vec2(vUV.x * aspectRatio, vUV.y);
        vec2 uvSquare = vec2(uv.x * aspectRatio, uv.y);
        float distance = length(uvSquare - vUVSquare);
        vec2 unitUVSquare = (uvSquare - vUVSquare) / distance;
        vec3 color = vec3(0.0);
        float limit1 = 0.03 * pow(planetRadius / 1e6, 0.2);
        float limit2 = 0.032 * pow(planetRadius / 1e6, 0.2);
        if(distance >= limit1 && distance <= limit2) {
            float angle = atan(unitUVSquare.y, unitUVSquare.x);
            float angleOff = 0.2;
            if((angle > angleOff && angle < 0.5 * 3.14 - angleOff)
            || (angle < -angleOff && angle > -0.5 * 3.14 + angleOff)
            || (angle > 0.5 * 3.14 + angleOff && angle < 3.14 - angleOff)
            || (angle < -0.5 * 3.14 - angleOff && angle > -3.14 + angleOff)) {
                color = 0.5e-3 * vec3(planetDistance / planetRadius);
                color = min(color, vec3(0.3));
            }
        }
        overlayColor = max(overlayColor, color);
    }

    gl_FragColor = vec4(screenColor + overlayColor, 1.0);
}
