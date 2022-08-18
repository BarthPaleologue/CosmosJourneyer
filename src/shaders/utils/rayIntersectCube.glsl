// from https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-box-intersection

bool rayIntersectCube(vec3 rayOrigin, vec3 rayDir, out float tmax, out float tmin) {
    vec3 min = vec3(-0.5, -0.5, -0.5);
    vec3 max = vec3(0.5, 0.5, 0.5);

    tmin = (min.x - rayOrigin.x) / rayDir.x;
    tmax = (max.x - rayOrigin.x) / rayDir.x;

    if (tmin > tmax) {
        float temp;
        temp = tmin;
        tmin = tmax;
        tmax = temp;
    }

    float tymin = (min.y - rayOrigin.y) / rayDir.y;
    float tymax = (max.y - rayOrigin.y) / rayDir.y;

    if (tymin > tymax) {
        float temp;
        temp = tymin;
        tymin = tymax;
        tymax = temp;
    }

    if ((tmin > tymax) || (tymin > tmax))
    return false;

    if (tymin > tmin)
    tmin = tymin;

    if (tymax < tmax)
    tmax = tymax;

    float tzmin = (min.z - rayOrigin.z) / rayDir.z;
    float tzmax = (max.z - rayOrigin.z) / rayDir.z;

    if (tzmin > tzmax) {
        float temp;
        temp = tzmin;
        tzmin = tzmax;
        tzmax = temp;
    }

    if ((tmin > tzmax) || (tzmin > tmax))
    return false;

    if (tzmin > tmin)
    tmin = tzmin;

    if (tzmax < tmax)
    tmax = tzmax;

    return true;
}

#pragma glslify: export(rayIntersectCube)