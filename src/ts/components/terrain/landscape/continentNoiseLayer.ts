import { Vector } from "../../toolbox/algebra";
import { simplex3FromVector } from "../../toolbox/noiseTools";

export function continentNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): (coords: Vector) => number {
    return function (coords: Vector) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            noiseValue += simplex3FromVector(samplePoint) / Math.pow(decay, i);

            totalAmplitude += 1.0 / Math.pow(decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = Math.pow(noiseValue, 2);

        if (minValue < 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
        }

        let riverFactor = 0.95;

        noiseValue *= riverFactor;
        noiseValue += 1 - riverFactor;

        return noiseValue;
    };
}