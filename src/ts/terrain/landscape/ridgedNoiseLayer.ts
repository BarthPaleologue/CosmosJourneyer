import { LVector3 } from "../../utils/algebra";
import { sAbs } from "../../utils/math";
import { simplex411 } from "../../utils/simplex";
import { elevationFunction } from "./elevationFunction";
import { fractalLayer3D } from "./fractalLayer3D";

export function ridgedNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    return fractalLayer3D(frequency, nbOctaves, decay, lacunarity, power, minValue, (coords: LVector3, gradient: LVector3) => {
        let elevation = simplex411(coords, gradient);

        // TODO: ne pas hardcoder
        let sharpness = 15.0;
        elevation = 1.0 - sAbs(elevation, sharpness, gradient);

        gradient.divideInPlace(-1);

        return elevation;
    });
}
