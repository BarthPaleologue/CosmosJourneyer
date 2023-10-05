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

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

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

// see https://www.shadertoy.com/view/tslcW4
const float a=1.0;
const float b=.1759;
const float PI=3.14159265359;

float spiralSDF(float u, float v) {

    float t=u;
    // t=(t+PI)/(2.*PI);
    float r=v;
    
    float n=(log(r/a)/b-t)/(2.*PI);

    // Cap the spiral
    // float nm = (log(0.11)/b-t)/(2.0*PI);
    // n = min(n,nm);
    // return (n+1.0)/100.0;
    float upper_r=a*exp(b*(t+2.*PI*ceil(n)));
    float lower_r=a*exp(b*(t+2.*PI*floor(n)));
    // float lower_r = 0.0;
    
    return min(abs(upper_r-r),abs(r-lower_r));
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
            // Find the intersection point relative to the star
            vec3 jetPointPosition1 = cameraPosition + t1 * rayDir - planetPosition;
            //vec3 jetPointPosition2 = cameraPosition + t2 * rayDir;

            // Then we rotate that point so that we eliminate the axial tilt of the star from the equation
            vec3 targetAxis = vec3(0.0, 1.0, 0.0);
            vec3 rotationRemovalAxis = cross(rotationAxis, targetAxis);
            jetPointPosition1 = rotateAround(jetPointPosition1, rotationRemovalAxis, -acos(dot(rotationAxis, targetAxis)));

            vec2 jetPointPositionPlane1 = vec2(jetPointPosition1.x, jetPointPosition1.z);
            float theta1 = atan(jetPointPositionPlane1.y, jetPointPositionPlane1.x);
            float h1 = abs(jetPointPosition1.y);

            float maxHeight = 4000000e3;

            float h1_01 = h1 / maxHeight;

            if(h1_01 > 1.0) {
                // cut cone at maxHeight
                finalColor = screenColor;
            } else {
                // if u,v are on spiral color blue, else color white
                float d = spiralSDF(theta1, h1_01);
                if (d < 0.1) {
                    finalColor = vec4(0.0, 0.0, 1.0, 1.0);
                } else {
                    finalColor = screenColor;
                }
            }
        }
    }

    gl_FragColor = finalColor; // displaying the final color
}