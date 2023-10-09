precision lowp float;

in vec2 vUV;// screen coordinates

uniform sampler2D textureSampler;// the original screen texture
uniform sampler2D depthSampler;// the depth map of the camera

#pragma glslify: camera = require(./utils/camera.glsl)

uniform vec4 planetInverseRotationQuaternion;

uniform float time;

#pragma glslify: object = require(./utils/object.glsl)

#pragma glslify: remap = require(./utils/remap.glsl)

#pragma glslify: worldFromUV = require(./utils/worldFromUV.glsl, inverseProjection=camera.inverseProjection, inverseView=camera.inverseView)

#pragma glslify: lerp = require(./utils/vec3Lerp.glsl)

#pragma glslify: rotateAround = require(./utils/rotateAround.glsl)

// from https://www.shadertoy.com/view/MtcXWr
bool rayIntersectCone(vec3 rayOrigin, vec3 rayDir, vec3 tipPosition, vec3 orientation, float coneAngle, out float t1, out float t2) {
    vec3 co = rayOrigin - tipPosition;

    float a = dot(rayDir, orientation)*dot(rayDir, orientation) - coneAngle*coneAngle;
    float b = 2. * (dot(rayDir, orientation)*dot(co, orientation) - dot(rayDir, co)*coneAngle*coneAngle);
    float c = dot(co, orientation)*dot(co, orientation) - dot(co, co)*coneAngle*coneAngle;

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

float spiralSDF(float theta, float radius) {

    float t=theta;
    // t=(t+PI)/(2.*PI);
    float r=radius;

    float n=(log(r/a)/b-t)/(2.*PI);

    // Cap the spiral
    // float nm = (log(0.11)/b-t)/(2.0*PI);
    // n = min(n,nm);
    // return (n+1.0)/100.0;
    float upper_r=a*exp(b*(t+2.*PI*ceil(n)));
    float lower_r=a*exp(b*(t+2.*PI*floor(n)));
    // float lower_r = 0.0;

    return min(abs(upper_r-r), abs(r-lower_r));
}

float spiralDensity(vec3 pointOnCone, vec3 coneAxis, float coneMaxHeight) {
    // Then we rotate that point so that we eliminate the axial tilt of the star from the equation
    vec3 targetAxis = vec3(0.0, 1.0, 0.0);
    vec3 rotationRemovalAxis = cross(coneAxis, targetAxis);
    vec3 pointOnYCone = rotateAround(pointOnCone, rotationRemovalAxis, -acos(dot(coneAxis, targetAxis)));

    vec2 pointOnXZPlane = vec2(pointOnYCone.x, pointOnYCone.z);
    float theta = atan(pointOnXZPlane.y, pointOnXZPlane.x) + 3.14 * min(0.0, sign(dot(pointOnCone, coneAxis)));
    float heightFraction = abs(pointOnYCone.y) / coneMaxHeight;

    float density = 1.0;

    // smoothstep fadeout when the height is too much (outside of cone) or too low (too close to the star)
    density *= smoothstep(0.0, 1.0, 1.0 - heightFraction) * smoothstep(0.0, 0.05, heightFraction);

    float d = spiralSDF(theta + time, 0.2 + heightFraction) / (0.3 + heightFraction * 2.0);
    //d = pow(d, 4.0);

    density *= smoothstep(0.85, 1.0, 1.0 - d);

    //density *= d * 500.0;

    return density;
}

void main() {
    vec4 screenColor = texture2D(textureSampler, vUV);// the current screen color

    float depth = texture2D(depthSampler, vUV).r;// the depth corresponding to the pixel in the depth map

    vec3 pixelWorldPosition = worldFromUV(vUV);// the pixel position in world space (near plane)

    // closest physical point from the camera in the direction of the pixel (occlusion)
    vec3 closestPoint = (pixelWorldPosition - camera.position) * remap(depth, 0.0, 1.0, camera.near, camera.far);
    float maximumDistance = length(closestPoint);// the maxium ray length due to occlusion

    vec3 rayDir = normalize(pixelWorldPosition - camera.position);// normalized direction of the ray

    vec4 finalColor = screenColor;

    const float jetHeight = 10000000e3;
    const vec3 jetColor = vec3(0.2, 0.2, 1.0);


    float t1, t2;
    if (rayIntersectCone(camera.position, rayDir, object.position, object.rotationAxis, 0.9, t1, t2)) {
        if (t2 > 0.0 && t2 < maximumDistance) {
            vec3 jetPointPosition2 = camera.position + t2 * rayDir - object.position;

            float density2 = spiralDensity(jetPointPosition2, object.rotationAxis, jetHeight);

            finalColor.rgb = mix(finalColor.rgb, jetColor, density2);
        }
        if (t1 > 0.0 && t1 < maximumDistance) {
            vec3 jetPointPosition1 = camera.position + t1 * rayDir - object.position;

            float density1 = spiralDensity(jetPointPosition1, object.rotationAxis, jetHeight);

            finalColor.rgb = mix(finalColor.rgb, jetColor, density1);
        }
    }

    gl_FragColor = finalColor;// displaying the final color
}