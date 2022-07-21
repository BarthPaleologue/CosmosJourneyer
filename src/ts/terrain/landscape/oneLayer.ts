import { constantLayer } from "./constantLayer";
import { elevationFunction } from "./elevationFunction";

export function oneLayer(): elevationFunction {
    return constantLayer(1);
}