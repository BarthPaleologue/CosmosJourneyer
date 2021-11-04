import { Vector } from "../../toolbox/algebra";
import { simplex3FromVector } from "../../toolbox/noiseTools";

export function mountainNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number) {
    return function (coords: Vector) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(lacunarity, i));

            noiseValue += simplex3FromVector(samplePoint) / Math.pow(decay, i);

            totalAmplitude += 1.0 / Math.pow(decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = 1 - Math.abs(noiseValue);

        if (minValue < 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
        }

        return noiseValue;
    };
}