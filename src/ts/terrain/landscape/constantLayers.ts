import { simpleElevationFunction } from "./elevationFunction";

export function constantLayer(value: number): simpleElevationFunction {
    return () => value;
}

export function zeroLayer(): simpleElevationFunction {
    return constantLayer(0);
}

export function oneLayer(): simpleElevationFunction {
    return constantLayer(1);
}
