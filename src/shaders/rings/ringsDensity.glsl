#include "../utils/noise1D.glsl";

#include "../utils/remap.glsl";

float ringDensityAtPoint(vec3 samplePoint) {
    vec3 samplePointPlanetSpace = samplePoint - object_position;

    float distanceToPlanet = length(samplePointPlanetSpace);
    float relativeDistance = distanceToPlanet / object_radius;

    // out if not intersecting with rings and interpolation area
    if (relativeDistance < rings_start || relativeDistance > rings_end) return 0.0;

    float uvX = remap(relativeDistance, rings_start, rings_end, 0.0, 1.0);
    vec2 uv = vec2(uvX, 0.0);
    
    // trick from https://www.shadertoy.com/view/3dVSzm to avoid Greenwich artifacts
    vec2 df = fwidth(uv);
    if(df.x > 0.5) df.x = 0.0;
    float lutDensity = textureLod(rings_lut, uv, log2(max(df.x, df.y) * 1024.0)).r;

    return lutDensity;
}