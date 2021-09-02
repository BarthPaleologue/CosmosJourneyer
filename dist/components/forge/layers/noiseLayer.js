import { normalizedSimplex3FromVector } from "../../../engine/noiseTools.js";
export class NoiseLayer {
    constructor(frequency, nbOctaves, decay, lacunarity, minValue) {
        this._frequency = frequency;
        this._nbOctaves = nbOctaves;
        this._decay = decay;
        this._lacunarity = lacunarity;
        this._minValue = minValue;
    }
    evaluate(coords) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        for (let i = 0; i < this._nbOctaves; i++) {
            let samplePoint = coords.scaleToNew(this._frequency);
            samplePoint = samplePoint.scaleToNew(Math.pow(this._lacunarity, i));
            noiseValue += normalizedSimplex3FromVector(samplePoint) / Math.pow(this._decay, i);
            totalAmplitude += 1.0 / Math.pow(this._decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseValue = Math.max(this._minValue, noiseValue) - this._minValue;
        noiseValue /= 1.0 - this._minValue;
        return noiseValue;
    }
}
