import { Vector } from "../../toolbox/algebra";
import { normalizedSimplex3FromVector } from "../../toolbox/noiseTools";
import { simplex3 } from "../../toolbox/simplex";

export function simplexNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): (coords: Vector) => number {
    return function (coords: Vector) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            noiseValue += normalizedSimplex3FromVector(samplePoint) / Math.pow(decay, i);

            totalAmplitude += 1.0 / Math.pow(decay, i);
        }
        noiseValue /= totalAmplitude;

        if (minValue != 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
            //noiseValue += this._minValue;
        }

        return noiseValue;
    };
}