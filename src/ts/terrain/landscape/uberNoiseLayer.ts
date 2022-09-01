import { LVector3 } from "../../utils/algebra";
import { pow } from "../../utils/gradientMath";
import { simplex401 } from "../../utils/simplex";
import { simpleElevationFunction } from "./elevationFunction";

export function uberLayer(frequency: number, decay: number, lacunarity: number, power: number): simpleElevationFunction {
    return function (coords: LVector3, seed: number, gradient: LVector3) {
        let noiseValue = 0.0;
        const localGradient = LVector3.Zero();

        /*const localRidgedGradient = LVector3.Zero();

        const ridgeErosionGradient = LVector3.Zero();
        const ridgeErosion = 0.7;

        const slopeErosionGradient = LVector3.Zero();
        const slopeErosion = 0.7;*/

        const samplePoint = coords.scale(frequency);
        const amps = [1.0, 0.3, 0.5, 0.2, 0.1];

        for (let i = 0; i < amps.length; i++) {
            //let localRidgedElevation = simplex411(samplePoint, power, localRidgedGradient);

            let localElevation = simplex401(samplePoint, seed, localGradient);
            localGradient.scaleInPlace(0.5);

            // TODO: ne pas hardcoder
            /*const sharpness = 4.0;
            localRidgedElevation = 1.0 - sAbs(localRidgedElevation, sharpness, localRidgedGradient);
            localRidgedGradient.divideInPlace(-1);*/

            const localAmplitude = amps[i] / (1.0 + gradient.getSquaredMagnitude());

            localElevation *= localAmplitude;
            localGradient.scaleInPlace(localAmplitude);

            //ridgeErosionGradient.addInPlace(localGradient.scale(ridgeErosion));
            //slopeErosionGradient.addInPlace(localGradient.scale(slopeErosion));

            noiseValue += localElevation;
            gradient.addInPlace(localGradient);

            samplePoint.scaleInPlace(lacunarity);
            samplePoint.addInPlace(localGradient.scaleInPlace(0.2));
        }
        const totalAmplitude = amps.reduce((a, b) => a + b, 0);
        noiseValue /= totalAmplitude;
        gradient.divideInPlace(totalAmplitude);

        return pow(noiseValue, power, gradient);
    };
}
