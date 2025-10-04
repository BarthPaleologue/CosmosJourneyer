// see https://farside.ph.utexas.edu/teaching/em/lectures/node104.html
float fractionReflected(float cosThetaI, float cosThetaT, float n1, float n2) {
    float alpha = abs(cosThetaI) > 0.01 ? cosThetaT / cosThetaI : 0.0;
    float beta = n2 / n1;
    return (1.0 - alpha * beta) * (1.0 - alpha * beta) / ((1.0 + alpha * beta) * (1.0 + alpha * beta));
}