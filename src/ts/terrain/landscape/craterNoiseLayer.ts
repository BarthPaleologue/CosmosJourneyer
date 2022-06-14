import { LVector3 } from "../../utils/algebra";
import { simplex401 } from "../../utils/simplex";

export function craterNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): (coords: LVector3, seed: number) => number {
    return function (coords: LVector3, seed: number) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            noiseValue += simplex401(samplePoint, seed) / Math.pow(decay, i);

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
