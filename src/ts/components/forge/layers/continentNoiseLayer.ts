import { Vector3 } from "../algebra";
import { simplex3FromVector } from "../../../engine/noiseTools";

export class ContinentNoiseLayer {
    _frequency: number;
    _nbOctaves: number;
    _decay: number;
    _lacunarity: number;
    _minValue: number;
    constructor(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number) {
        this._frequency = frequency;
        this._nbOctaves = nbOctaves;
        this._decay = decay;
        this._lacunarity = lacunarity;
        this._minValue = minValue;
    }
    evaluate(coords: Vector3) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < this._nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(this._frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(this._lacunarity, i));

            noiseValue += simplex3FromVector(samplePoint) / Math.pow(this._decay, i);

            totalAmplitude += 1.0 / Math.pow(this._decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = Math.pow(noiseValue, 2);

        if (this._minValue < 1) {
            noiseValue = Math.max(this._minValue, noiseValue) - this._minValue;
            noiseValue /= 1.0 - this._minValue;
        }

        let riverFactor = 0.95;

        noiseValue *= riverFactor;
        noiseValue += 1 - riverFactor;

        return noiseValue;
    }
}