import { elevationFunction } from "./elevationFunction";

export function constantLayer(value: number): elevationFunction {
    return () => value;
}