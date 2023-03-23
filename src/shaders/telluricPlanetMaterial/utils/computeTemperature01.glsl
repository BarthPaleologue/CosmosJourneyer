float computeTemperature01(float elevation01, float absLatitude01, float ndl, float dayDuration) {
    // TODO: do not hardcode both
    float temperatureHeightFalloff = 1.2;
    float temperatureLatitudeFalloff = 1.0;

    // TODO: do not hardcode that factor
    float temperatureRotationFactor = smoothstep(0.0, 1.0, 0.15 * dayDuration);

    // https://www.desmos.com/calculator/apezlfvwic
    float temperature01 = 1.0;

    // temperature drops with latitude
    // https://www.researchgate.net/profile/Anders-Levermann/publication/274494740/figure/fig3/AS:391827732615174@1470430419170/a-Surface-air-temperature-as-a-function-of-latitude-for-data-averaged-over-1961-90-for.png
    temperature01 -= pow(temperatureLatitudeFalloff * absLatitude01, 3.0);

    // temperature drops exponentially with elevation
    temperature01 *= exp(-elevation01 * temperatureHeightFalloff);
    
    // temperature drops during nighttime (more ice)
    temperature01 *= ndl * temperatureRotationFactor + 1.0 - temperatureRotationFactor;

    // cannot exceed max and min temperatures
    temperature01 = clamp(temperature01, 0.0, 1.0);

    return temperature01;
}

#pragma glslify: export(computeTemperature01)
