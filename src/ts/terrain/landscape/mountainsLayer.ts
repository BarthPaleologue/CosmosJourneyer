import { LVector3 } from "../../utils/algebra";
import { sAbs, sFloor } from "../../utils/math";
import { simplex411 } from "../../utils/simplex";
import { elevationFunction } from "./elevationFunction";
import { fractalLayer3D } from "./fractalLayer3D";

export function mountainsLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    const dsum = LVector3.Zero();
    return function(coords: LVector3, seed: number, gradient: LVector3) {
        let noiseValue = 0.0;
        let totalAmplitude = 0.0;
        const oldLocalGradient = LVector3.Zero();
        const localGradient = LVector3.Zero();
        const samplePoint = coords.scale(frequency);
        for (let i = 0; i < nbOctaves; i++) {
            let localElevation = simplex411(samplePoint, seed, localGradient);

            // TODO: ne pas hardcoder
            const sharpness = 15.0;
            localElevation = 1.0 - sAbs(localElevation, sharpness, localGradient);

            localGradient.divideInPlace(-1);

            // erosion
            /*const planetNormal = coords.normalizeToNew();
            const gradientY = LVector3.Dot(localGradient, planetNormal);
            const gradientXZ = localGradient.subtract(planetNormal.scale(gradientY));
            dsum.addInPlace(gradientXZ);

            if(i>1) {
                localElevation = gradient.x / (1.0 + dsum.getSquaredMagnitude());
                localGradient.scaleInPlace(gradient.x / (1.0 + dsum.getSquaredMagnitude()));
            }*/

            localGradient.divideInPlace(decay ** i);

            noiseValue += localElevation / decay ** i;
            gradient.addInPlace(localGradient);

            totalAmplitude += 1.0 / decay ** i;

            samplePoint.scaleInPlace(lacunarity);

            oldLocalGradient.copyFrom(localGradient);
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
