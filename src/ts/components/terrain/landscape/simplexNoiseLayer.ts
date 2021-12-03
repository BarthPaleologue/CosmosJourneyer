import { Vector3 } from "../../toolbox/algebra";
import { smin2 } from "../../toolbox/math";
import { simplex401 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function simplexNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    return function (coords: Vector3): number[] {
        let noiseValue = 0.0;
        let noiseGradient = Vector3.Zero();
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; i++) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(Math.pow(lacunarity, i));

            let terrainData = simplex401(samplePoint);
            let localElevation = terrainData[0];
            let localGradient = new Vector3(terrainData[1], terrainData[2], terrainData[3]);
            noiseValue += localElevation / Math.pow(decay, i);
            noiseGradient.addInPlace(localGradient.divide(Math.pow(decay, i)));

            totalAmplitude += 1.0 / Math.pow(decay, i);
        }
        noiseValue /= totalAmplitude;
        noiseGradient.divideInPlace(totalAmplitude);

        noiseValue = Math.pow(noiseValue, power);
        noiseGradient.scaleInPlace(power);

        if (minValue > 0) {
            if (minValue != 1) {
                if (noiseValue <= minValue) {
                    noiseValue = 0;
                    noiseGradient = Vector3.Zero();
                } else {
                    noiseGradient.divideInPlace((1 - minValue));
                    noiseGradient.scaleInPlace(Math.pow(noiseValue - minValue, 0.2)); // continuité à l'arrache
                    noiseValue -= minValue;
                    noiseValue /= 1 - minValue;
                }
            } else {
                throw new Error("minValue must be != 1");
            }
        }




        return [noiseValue, noiseGradient.x, noiseGradient.y, noiseGradient.z];
    };
}