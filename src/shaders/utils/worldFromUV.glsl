// compute the world position of a pixel from its uv coordinates
// This is an evolution from the code found here
// https://forum.babylonjs.com/t/pixel-position-in-world-space-from-fragment-postprocess-shader-issue/30232
// also see https://www.babylonjs-playground.com/#1PHYB0#315 for smaller scale testing
// This is a revised version that works with the reverse depth buffer
vec3 worldFromUV(vec2 pos, mat4 inverseProjection, mat4 inverseView) {
    vec4 ndc = vec4(pos.xy * 2.0 - 1.0, 1.0, 1.0); // get ndc position (z = 1 because the depth buffer is reversed)
    vec4 posVS = inverseProjection * ndc; // unproject the ndc coordinates : we are now in view space if i understand correctly
    vec4 posWS = inverseView * posVS; // then we use inverse view to get to world space, division by w to get actual coordinates
    return  posWS.xyz; // the coordinates in world space
}
