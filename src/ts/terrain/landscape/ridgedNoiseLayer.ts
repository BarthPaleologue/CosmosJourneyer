import { LVector3 } from "../../utils/algebra";
import { sAbs } from "../../utils/math";
import { simplex411 } from "../../utils/simplex";
import { simpleElevationFunction } from "./elevationFunction";
import { simpleFractalLayer3D } from "./simpleFractalLayer3D";

export function ridgedNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): simpleElevationFunction {
    return simpleFractalLayer3D(frequency, nbOctaves, decay, lacunarity, power, minValue, (coords: LVector3, seed: number, gradient: LVector3) => {
        let elevation = simplex411(coords, seed, gradient);

        // TODO: ne pas hardcoder
        const sharpness = 15.0;
        elevation = 1.0 - sAbs(elevation, sharpness, gradient);

        gradient.divideInPlace(-1);

        return elevation;
    });
}
