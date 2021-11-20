import { Vector } from "../../toolbox/algebra";
import { simplex401 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function simplexNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): elevationFunction {
    return function (coords: Vector): [number, Vector] {
        let noiseValue = 0.0;
        let noiseNormal = Vector.Zeros(3);
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            let [localElevation, localNormal] = simplex401(samplePoint);

            noiseValue += localElevation / Math.pow(decay, i);
            noiseNormal.addInPlace(localNormal.divide(Math.pow(decay, i)));

            totalAmplitude += 1.0 / Math.pow(decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseNormal.divideInPlace(totalAmplitude);

        if (minValue != 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
            noiseNormal.divideInPlace(1.0 - minValue);
            //noiseValue += this._minValue;
        }

        return [noiseValue, noiseNormal];
    };
}