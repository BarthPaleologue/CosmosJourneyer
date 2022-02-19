import { simplex401 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";
import { fractalLayer3D } from "./fractalLayer3D";

export function simplexNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    return fractalLayer3D(frequency, nbOctaves, decay, lacunarity, power, minValue, simplex401);
}