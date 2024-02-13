vec3 refract(vec3 ray, vec3 normal, float n1, float n2) {
    float n1n2 = n1 / n2;
    float cosThetaI = -dot(ray, normal);
    float sin2ThetaI = max(0.0, 1.0 - cosThetaI * cosThetaI);
    float sin2ThetaT = n1n2 * n1n2 * sin2ThetaI;
    if (sin2ThetaT >= 1.0) return vec3(0.0, 0.0, 0.0);
    float cosThetaT = sqrt(1.0 - sin2ThetaT);
    return ray * n1n2 + normal * (n1n2 * cosThetaI - cosThetaT);
}

// see https://farside.ph.utexas.edu/teaching/em/lectures/node104.html
float fractionReflected(float cosThetaI, float cosThetaT, float n1, float n2) {
    float alpha = abs(cosThetaI) > 0.01 ? cosThetaT / cosThetaI : 0.0;
    float beta = n2 / n1;
    return (1 - alpha * beta) * (1 - alpha * beta) / ((1 + alpha * beta) * (1 + alpha * beta));
}