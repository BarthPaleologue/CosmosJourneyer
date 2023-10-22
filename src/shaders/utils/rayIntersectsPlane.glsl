bool rayIntersectsPlane(vec3 rayOrigin, vec3 rayDir, vec3 planePosition, vec3 planeNormal, float tolerance, out float t) {
    float denom = dot(rayDir, planeNormal);
    if (abs(denom) <= tolerance) return false;// ray is parallel to the plane
    t = dot(planeNormal, planePosition - rayOrigin) / denom;
    return t >= 0.0;
}

#pragma glslify: export(rayIntersectsPlane)