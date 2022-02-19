import { Vector3 } from "../../toolbox/algebra";
import { sAbs } from "../../toolbox/math";
import { simplex411 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";
import { fractalLayer3D } from "./fractalLayer3D";

export function ridgedNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    return fractalLayer3D(frequency, nbOctaves, decay, lacunarity, power, minValue, (coords: Vector3, gradient: Vector3) => {
        let elevation = simplex411(coords, gradient);

        // TODO: ne pas hardcoder
        let sharpness = 15.0;
        elevation = 1.0 - sAbs(elevation, sharpness, gradient);

        gradient.divideInPlace(-1);

        return elevation;
    });
}