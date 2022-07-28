import { simplex401 } from "../../utils/simplex";
import { simpleElevationFunction } from "./elevationFunction";
import { simpleFractalLayer3D } from "./simpleFractalLayer3D";

export function simplexNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number): simpleElevationFunction {
    return simpleFractalLayer3D(frequency, nbOctaves, decay, lacunarity, power, simplex401);
}
