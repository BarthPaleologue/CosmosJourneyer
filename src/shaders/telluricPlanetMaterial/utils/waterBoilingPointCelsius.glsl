// https://www.omnicalculator.com/chemistry/boiling-point
// https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
// https://www.desmos.com/calculator/ctxerbh48s
float waterBoilingPointCelsius(float pressure) {
    float P1 = 1.0;
    float P2 = pressure;
    float T1 = 100.0 + 273.15;
    float DH = 40660.0;
    float R = 8.314;
    if(P2 > 0.0) return (1.0 / ((1.0 / T1) + log(P1 / P2) * (R / DH))) - 273.15;
    return -273.15;
}