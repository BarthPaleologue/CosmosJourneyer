import { Vector } from "../../toolbox/algebra";
import { simplex401 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function mountainNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): elevationFunction {
    return function (coords: Vector): [number, Vector] {
        let noiseValue = 0.0;
        let noiseNormal = Vector.Zeros(3);
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; ++i) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(lacunarity ** i);

            let [localElevation, localNormal] = simplex401(samplePoint);

            noiseValue += localElevation / decay ** i;
            noiseNormal.addInPlace(localNormal.divide(decay ** i));

            totalAmplitude += 1.0 / decay ** i;
        }
        noiseValue /= totalAmplitude;
        noiseNormal.divideInPlace(totalAmplitude);

        //noiseValue = 1 - Math.abs(noiseValue);

        if (minValue < 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
            noiseNormal.divideInPlace(1.0 - minValue);
        }

        return [noiseValue, noiseNormal];
    };
}