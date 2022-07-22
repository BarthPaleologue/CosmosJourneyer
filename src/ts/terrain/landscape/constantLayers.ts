import { elevationFunction } from "./elevationFunction";

export function constantLayer(value: number): elevationFunction {
    return () => value;
}

export function zeroLayer(): elevationFunction {
    return constantLayer(0);
}

export function oneLayer(): elevationFunction {
    return constantLayer(1);
}