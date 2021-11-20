import { Vector3 } from "../../toolbox/algebra";
import { simplex401 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function mountainNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): elevationFunction {
    return function (coords: Vector3): number[] {
        let noiseValue = 0.0;
        let noiseNormal = Vector3.Zero();
        let totalAmplitude = 0.0;
        for (let i = 0; i < nbOctaves; ++i) {
            let samplePoint = coords.scale(frequency);
            samplePoint = samplePoint.scale(lacunarity ** i);

            let terrainData = simplex401(samplePoint);
            let localElevation = terrainData[0];
            let localNormal = new Vector3(terrainData[1], terrainData[2], terrainData[3]);
            noiseValue += localElevation / decay ** i;
            noiseNormal.addInPlace(localNormal.divide(decay ** i));

            totalAmplitude += 1.0 / decay ** i;
        }
        noiseValue /= totalAmplitude;
        noiseNormal.divideInPlace(totalAmplitude);

        //noiseValue = 1 - Math.abs(noiseValue);

        if (minValue < 1) {
            noiseValue = Math.max(minValue, noiseValue) - minValue;
            noiseValue /= 1.0 - minValue;
            noiseNormal.divideInPlace(1.0 - minValue);
        }

        return [noiseValue, noiseNormal.x, noiseNormal.y, noiseNormal.z];
    };
}