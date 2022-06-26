// https://www.omnicalculator.com/chemistry/boiling-point
// https://www.wikiwand.com/en/Boiling_point#/Saturation_temperature_and_pressure
// https://www.desmos.com/calculator/ctxerbh48s
export function waterBoilingPointCelsius(pressure: number): number {
    const P1 = 1.0;
    const P2 = pressure;
    const T1 = 100.0 + 273.15;
    const DH = 40660.0;
    const R = 8.314;
    if(P2 > 0.0) return (1.0 / ((1.0 / T1) + Math.log(P1 / P2) * (R / DH))) - 273.15;
    return -273.15;
}