import { LVector3 } from "../../utils/algebra";
import { minimumValue, pow, sAbs } from "../../utils/gradientMath";
import { simplex411 } from "../../utils/simplex";
import { simpleElevationFunction } from "./elevationFunction";

export function mountainLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): simpleElevationFunction {
    return function (coords: LVector3, seed: number, gradient: LVector3) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        const localGradient = LVector3.Zero();
        const samplePoint = coords.scale(frequency);
        for (let i = 0; i < nbOctaves; i++) {
            let localElevation = simplex411(samplePoint, seed, localGradient);

            // TODO: ne pas hardcoder
            const sharpness = 8.0;
            localElevation = 1.0 - sAbs(localElevation, sharpness, localGradient);

            localGradient.divideInPlace(-1);

            localElevation /= decay ** i * (1.0 + gradient.getSquaredMagnitude());
            localGradient.divideInPlace(decay ** i * (1.0 + gradient.getSquaredMagnitude()));

            noiseValue += localElevation;
            gradient.addInPlace(localGradient);

            totalAmplitude += 1.0 / decay ** i;

            samplePoint.scaleInPlace(lacunarity);
        }
        noiseValue /= totalAmplitude;
        gradient.divideInPlace(totalAmplitude);

        if (minValue > 0) noiseValue = minimumValue(noiseValue, minValue, gradient);

        return pow(noiseValue, power, gradient);
    };
}
