import { Vector3 } from "../../toolbox/algebra";
import { sAbs, sFloor } from "../../toolbox/math";
import { simplex411 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function ridgedNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, power: number, minValue: number): elevationFunction {
    return function (coords: Vector3): number[] {
        let noiseValue = 0.0;
        let noiseGradient = Vector3.Zero();
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; ++i) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(lacunarity ** i);

            let terrainData = simplex411(samplePoint);
            let localElevation = terrainData[0];
            let localGradient = new Vector3(terrainData[1], terrainData[2], terrainData[3]);

            // TODO: ne pas hardcoder
            let sharpness = 15.0;
            localElevation = 1.0 - sAbs(localElevation, sharpness, localGradient);

            localGradient.divideInPlace(-1);
            localGradient.divideInPlace(decay ** i);

            //localGradient.scaleInPlace(power * Math.pow(localElevation, power - 1));
            //localElevation = Math.pow(localElevation, power);

            noiseValue += localElevation / decay ** i;
            noiseGradient.addInPlace(localGradient);

            totalAmplitude += 1.0 / decay ** i;
        }

        noiseValue /= totalAmplitude;
        noiseGradient.divideInPlace(totalAmplitude);



        if (minValue > 0) {
            if (minValue != 1) {
                //noiseGradient.scaleInPlace(sFloorGradient(noiseValue, minValue, 100.0));
                noiseValue = sFloor(noiseValue, minValue, 100.0, noiseGradient);
                noiseValue -= minValue;
                noiseValue /= 1 - minValue;
                noiseGradient.divideInPlace(1 - minValue);
            } else {
                throw new Error("minValue must be != 1");
            }
        }

        noiseGradient.scaleInPlace(power * Math.pow(noiseValue, power - 1));
        noiseValue = Math.pow(noiseValue, power);

        return [noiseValue, noiseGradient.x, noiseGradient.y, noiseGradient.z];
    };
}