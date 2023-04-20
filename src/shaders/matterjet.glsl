precision lowp float;

varying vec2 vUV; // screen coordinates

uniform sampler2D textureSampler; // the original screen texture
uniform sampler2D depthSampler; // the depth map of the camera

uniform vec3 cameraPosition; // position of the camera in world space

uniform mat4 inverseProjection; // camera's projection matrix
uniform mat4 inverseView; // camera's view matrix

uniform float cameraNear; // camera minZ
uniform float cameraFar; // camera maxZ

uniform vec3 planetPosition; // planet position in world space

uniform vec4 planetInverseRotationQuaternion;

uniform float time;

uniform vec3 rotationAxis;

uniform vec3 forwardAxis; // to compute the angle of the matter jet

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=inverseProjection, inverseView=inverseView)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

#pragma glslify: applyQuaternion = require(./utils/applyQuaternion.glsl)

// from https://www.shadertoy.com/view/MtcXWr
bool rayIntersectCone(vec3 rayOrigin, vec3 rayDir, vec3 tipPosition, vec3 orientation, float coneAngle, out float t1, out float t2) {
    vec3 co = rayOrigin - tipPosition;

    float a = dot(rayDir,orientation)*dot(rayDir,orientation) - coneAngle*coneAngle;
    float b = 2. * (dot(rayDir,orientation)*dot(co,orientation) - dot(rayDir,co)*coneAngle*coneAngle);
    float c = dot(co,orientation)*dot(co,orientation) - dot(co,co)*coneAngle*coneAngle;

    float det = b*b - 4.*a*c;
    if (det < 0.) return false;

    det = sqrt(det);
    t1 = (-b - det) / (2. * a);
    t2 = (-b + det) / (2. * a);

    // This is a bit messy; there ought to be a more elegant solution.
    float t = t1;
    if (t < 0. || t2 > 0. && t2 < t) t = t2;
    if (t < 0.) return false;

    vec3 cp = rayOrigin + t*rayDir - tipPosition;
    float h = dot(cp, orientation);

    vec3 n = normalize(cp * dot(orientation, cp) / dot(cp, cp) - orientation);

    return true;
}

vec4 matterJets(vec3 rayOrigin, vec3 rayDir, float maximumDistance) {
    return vec4(0.0, 0.0, 0.0, 0.0);
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV); // the current screen color

    float depth = texture2D(depthSampler, vUV).r; // the depth corresponding to the pixel in the depth map
    
    vec3 pixelWorldPosition = worldFromUV(vUV); // the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - cameraPosition) * remap(depth, 0.0, 1.0, cameraNear, cameraFar);
    float maximumDistance = length(closestPoint); // the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - cameraPosition); // normalized direction of the ray

    vec4 finalColor = screenColor;
    
    float t1, t2;
    if(rayIntersectCone(cameraPosition, rayDir, planetPosition, rotationAxis, 0.9, t1, t2)) {
        if(t1 < maximumDistance) {
            vec3 jetPointPosition1 = cameraPosition + t1 * rayDir;
            vec3 jetPointPosition2 = cameraPosition + t2 * rayDir;

            vec3 jetPositionOnAxis1 = planetPosition + dot(jetPointPosition1 - planetPosition, rotationAxis) * rotationAxis;
            vec3 jetPositionOnAxis2 = planetPosition + dot(jetPointPosition2 - planetPosition, rotationAxis) * rotationAxis;

            vec3 jetPositionOnPlane1 = jetPointPosition1 - jetPositionOnAxis1;
            vec3 jetPositionOnPlane2 = jetPointPosition2 - jetPositionOnAxis2;

            float jetHeight1 = abs(dot(jetPointPosition1 - planetPosition, rotationAxis));
            float jetHeight2 = abs(dot(jetPointPosition2 - planetPosition, rotationAxis));

            float maxHeight = 2000000e3;
            float minHeight = 300000e3;

            float jetHeight101 = min(jetHeight1 / maxHeight, 1.0);
            float jetHeight201 = min(jetHeight2 / maxHeight, 1.0);

            // theta is the accumulated angle of the jet (spiral)
            float theta1 = 3.0 * jetHeight101 + acos(dot(normalize(jetPositionOnPlane1), forwardAxis));
            float theta2 = 3.0 * jetHeight201 + acos(dot(normalize(jetPositionOnPlane2), forwardAxis));
            
            //float theta1 = acos(dot(normalize(jetPositionOnPlane1), forwardAxis));
            //float theta2 = acos(dot(normalize(jetPositionOnPlane2), forwardAxis));

            float jetPointRadius1 = length(jetPointPosition1 - jetPositionOnAxis1);
            float jetPointRadius2 = length(jetPointPosition2 - jetPositionOnAxis2);

            vec3 jetDirection1 = normalize(jetPointPosition1 - planetPosition);
            vec3 jetDirection2 = normalize(jetPointPosition2 - planetPosition);


            float colorFalloff1 = smoothstep(maxHeight, 0.6 * maxHeight, jetHeight1);
            float colorFalloff2 = smoothstep(maxHeight, 0.6 * maxHeight, jetHeight2);

            colorFalloff1 *= smoothstep(0.2 * minHeight, minHeight, jetHeight1);
            colorFalloff2 *= smoothstep(0.2 * minHeight, minHeight, jetHeight2);

            colorFalloff1 = 1.0;
            colorFalloff2 = 1.0;

            //float spiral1 = mod(jetHeight101 * theta1 * 50.0, 10.0) / 10.0;
            //float spiral2 = mod(jetHeight102 * theta2 * 50.0, 10.0) / 10.0;

            vec3 jetColor1 = vec3(0.0, 0.0, 1.0 + 0.5 * cos(theta1));
            vec3 jetColor2 = vec3(0.0, 0.0, 1.0 + 0.5 * cos(theta2));

            float r1 = jetPointRadius1;
            float r2 = jetPointRadius2;

            /*float x1 = r1 * cos(theta1);
            float x2 = r2 * cos(theta2);

            float y1 = r1 * sin(theta1);
            float y2 = r2 * sin(theta2);

            float z1 = jetHeight1;
            float z2 = jetHeight2;*/

            // Idea project the 3D point on the base of the cone and check the distance to the spiral on the base plane

            float d1 = sqrt(pow(r1 - 200e6 * theta1, 2.0) + theta1 * theta1);
            float d2 = sqrt(pow(r2 - 200e6 * theta2, 2.0) + theta2 * theta2);

            if(d1 > 50e6) {
                colorFalloff1 = 0.0;
            }

            if(d2 > 50e6) {
                colorFalloff2 = 0.0;
            }

            /*float m1 = 0.5;
            float m2 = 0.5;

            float distanceToSpiral1 = abs(m1*m1*(x1 * x1 + y1 * y1) - z1 * z1);
            float distanceToSpiral2 = abs(m2*m2*(x2 * x2 + y2 * y2) - z2 * z2);

            if(distanceToSpiral1 > 1e18) {
                colorFalloff1 = 0.0;
            }

            if(distanceToSpiral2 > 1e18) {
                colorFalloff2 = 0.0;
            }*/

            jetColor1 *= colorFalloff1;
            jetColor2 *= colorFalloff2;

            finalColor.rgb = lerp(finalColor.rgb, jetColor1, 1.0 - colorFalloff1);
            finalColor.rgb = lerp(finalColor.rgb, jetColor2, 1.0 - colorFalloff2);
        }
    }

    gl_FragColor = finalColor; // displaying the final color
}