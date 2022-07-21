import { elevationFunction } from "./elevationFunction";
import { constantLayer } from "./constantLayer";

export function zeroLayer(): elevationFunction {
    return constantLayer(0);
}