import { LVector3 } from "../../toolbox/algebra";
import { sFloor } from "../../toolbox/math";
import { elevationFunction } from "./elevationFunction";

export function fractalLayer3D(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number, f: (coords: LVector3, gradient: LVector3) => number): elevationFunction {
    return function (coords: LVector3, gradient: LVector3) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        let localGradient = LVector3.Zero();
        let samplePoint = coords.scale(frequency);
        for (let i = 0; i < nbOctaves; i++) {

            let localElevation = f(samplePoint, localGradient);

            localGradient.divideInPlace(decay ** i);

            noiseValue += localElevation / decay ** i;
            gradient.addInPlace(localGradient);

            totalAmplitude += 1.0 / decay ** i;

            samplePoint.scaleInPlace(lacunarity);
        }
        noiseValue /= totalAmplitude;
        gradient.divideInPlace(totalAmplitude);

        if (minValue > 0) {
            if (minValue != 1) {
                // TODO: ne pas hardcoder k
                noiseValue = sFloor(noiseValue - minValue, 0, 100.0, gradient);
                noiseValue /= 1 - minValue;
                gradient.divideInPlace(1 - minValue);
            } else {
                throw new Error("minValue must be != 1");
            }
        }

        gradient.scaleInPlace(power * Math.pow(noiseValue, power - 1));
        noiseValue = noiseValue ** power;

        return noiseValue;
    };
}