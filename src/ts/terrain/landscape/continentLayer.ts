import { elevationFunction } from "./elevationFunction";
import { LVector3 } from "../../utils/algebra";
import { simplex401, simplex411 } from "../../utils/simplex";
import { fractalLayer3D } from "./fractalLayer3D";

export function continentLayer(frequency: number, nbOctaves: number, minValue: number): elevationFunction {
    return fractalLayer3D(frequency, 5, 1.9, 2.0, 0.8, minValue, (coords: LVector3, seed: number, gradient: LVector3) => {
        const warpedCoords = coords.clone();
        const warpingStrength = 1;
        warpedCoords.x += warpingStrength * simplex411(warpedCoords, seed);
        warpedCoords.y += warpingStrength * simplex411(warpedCoords.add(new LVector3(13, 37, -67)), seed);
        warpedCoords.z += warpingStrength * simplex411(warpedCoords.add(new LVector3(-53, 19, -29)), seed);

        return simplex401(warpedCoords, seed, gradient);
    });
}