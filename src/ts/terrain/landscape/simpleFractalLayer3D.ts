import { LVector3 } from "../../utils/algebra";
import { minimumValue, pow } from "../../utils/math";
import { simpleElevationFunction } from "./elevationFunction";

export function simpleFractalLayer3D(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number, f: simpleElevationFunction): simpleElevationFunction {
    return function(coords: LVector3, seed: number, gradient: LVector3) {
        let noiseValue = 0.0;
        const totalAmplitude = (1.0 - (1.0 / decay) ** (nbOctaves + 1)) / (1.0 - (1.0 / decay));
        const localGradient = LVector3.Zero();
        const samplePoint = coords.scale(frequency);
        for (let i = 0; i < nbOctaves; i++) {
            const localElevation = f(samplePoint, seed, localGradient) / decay ** i;
            localGradient.divideInPlace(decay ** i);

            noiseValue += localElevation;
            gradient.addInPlace(localGradient);

            samplePoint.scaleInPlace(lacunarity);
        }
        noiseValue /= totalAmplitude;
        gradient.divideInPlace(totalAmplitude);

        if (minValue > 0) noiseValue = minimumValue(noiseValue, minValue, gradient);

        return pow(noiseValue, power, gradient);
    };
}
