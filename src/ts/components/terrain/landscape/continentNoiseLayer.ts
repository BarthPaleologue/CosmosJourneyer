import { Vector3 } from "../../toolbox/algebra";
import { simplex401 } from "../../toolbox/simplex";

export function continentNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): (coords: Vector3) => number {
    return function (coords: Vector3) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            noiseValue += simplex401(samplePoint)[0] / Math.pow(decay, i);

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