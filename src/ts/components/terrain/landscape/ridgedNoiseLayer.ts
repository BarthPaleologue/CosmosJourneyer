import { Vector3 } from "../../toolbox/algebra";
import { simplex411 } from "../../toolbox/simplex";
import { elevationFunction } from "./elevationFunction";

export function ridgedNoiseLayer(frequency: number, nbOctaves: number, decay: number, lacunarity: number, minValue: number): elevationFunction {
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
            noiseValue += localElevation / decay ** i;
            noiseGradient.addInPlace(localGradient.divide(decay ** i));

            totalAmplitude += 1.0 / decay ** i;
        }
        noiseValue /= totalAmplitude;
        noiseGradient.divideInPlace(totalAmplitude);

        //noiseValue = 1 - Math.abs(noiseValue);

        if (noiseValue > 0) {
            // flip noiseValue
            noiseValue = -noiseValue;
            // flip normal
            let sphereNormal = coords.normalize();
            let normalComp = Vector3.Dot(noiseGradient, sphereNormal);

            // symétrie par rapport au plan tangent à la sphère
            noiseGradient.subtractInPlace(sphereNormal.scale(2 * normalComp));
            // sym(v) = v - 2*(n.v)n

            // on le met dans le bon sens
            noiseGradient.scaleInPlace(-1);
        }

        // on passe d'une range de [-1,1] à [0,1]
        noiseGradient.divideInPlace(2);

        noiseValue += 1;

        if (minValue > 0) {
            if (minValue != 1) {
                if (noiseValue <= minValue) {
                    noiseValue = 0;
                    noiseGradient = coords.normalize();
                } else {
                    noiseValue -= minValue;
                    noiseValue /= 1 - minValue;
                    noiseGradient.divideInPlace(1 - minValue);
                }
            } else {
                throw new Error("minValue must be != 1");
            }
        }

        return [noiseValue, noiseGradient.x, noiseGradient.y, noiseGradient.z];
    };
}