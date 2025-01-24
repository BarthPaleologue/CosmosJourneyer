/** https://www.shadertoy.com/view/llGXDR */
float rayMarch(vec3 rayOrigin, vec3 rayDir, float initialDepth) {
    float currentDepth = initialDepth;
    float newDistance = initialDepth;
    float stepSizeFactor = 1.3;
    float oldDistance = 0.0;
    float stepSize = 0.0;
    float cerr = 10000.0;
    float ct = 0.0;
    float pixradius = 1.0 / averageScreenSize;
    int inter = 0;
    for (int i = 0; i < 64; i++) {
        oldDistance = newDistance;
        newDistance = distanceEstimator(rayOrigin + rayDir * currentDepth);
        
        //Detect intersections missed by over-relaxation
        if(stepSizeFactor > 1.0 && abs(oldDistance) + abs(newDistance) < stepSize){
            stepSize -= stepSizeFactor * stepSize;
            stepSizeFactor = 1.0;
            currentDepth += stepSize;
            continue;
        }
        stepSize = stepSizeFactor * newDistance;
        
        float err = newDistance / currentDepth;
        
        if(abs(err) < abs(cerr)){
            ct = currentDepth;
            cerr = err;
        }
        
        //Intersect when d / t < one pixel
        if(abs(err) < pixradius) {
            inter = 1;
            break;
        }
        
        currentDepth += stepSize;
        /*if(currentDepth > 30.0){
            break;
        }*/
    }
    if(inter == 0){
        ct = -1.0;
    }
    return ct;
}

float map(vec3 p){
    return distanceEstimator(p);
}

//Approximate normal
vec3 getNormal(vec3 p){
    return normalize(vec3(map(vec3(p.x + 0.0001, p.yz)) - map(vec3(p.x - 0.0001, p.yz)),
                          map(vec3(p.x, p.y + 0.0001, p.z)) - map(vec3(p.x, p.y - 0.0001, p.z)),
                	      map(vec3(p.xy, p.z + 0.0001)) - map(vec3(p.xy, p.z - 0.0001))));
}

//Determine if a point is in shadow - 1.0 = not in shadow
float getShadow(vec3 rayOrigin, vec3 rayDir, vec3 starPosition) {
    float t = 0.01;
    float d = 0.0;
    float shadow = 1.0;
    for(int iter = 0; iter < 64; iter++){
        d = map(rayOrigin + rayDir * t);
        if(d < 0.0001){
            return 0.5;
        }
        if(t > length(rayOrigin - starPosition) - 0.5){
            break;
        }
        shadow = min(shadow, 32.0 * d / t);
        t += d;
    }
    return 0.5 + 0.5 * shadow;
}