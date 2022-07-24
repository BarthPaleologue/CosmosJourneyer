import { simpleElevationFunction } from "./elevationFunction";
import { LVector3 } from "../../utils/algebra";
import { simplex401, simplex411 } from "../../utils/simplex";
import { simpleFractalLayer3D } from "./simpleFractalLayer3D";

export function continentLayer(frequency: number, nbOctaves: number): simpleElevationFunction {
    return simpleFractalLayer3D(frequency, nbOctaves, 2.0, 2.0, 0.8, 0.0, (coords: LVector3, seed: number, gradient: LVector3) => {
        const warpedCoords = coords.clone();
        const warpingStrength = 0.6;
        warpedCoords.x += warpingStrength * simplex411(warpedCoords, seed);
        warpedCoords.y += warpingStrength * simplex411(warpedCoords.add(new LVector3(13, 37, -67)), seed);
        warpedCoords.z += warpingStrength * simplex411(warpedCoords.add(new LVector3(-53, 19, -29)), seed);

        return simplex401(warpedCoords, seed, gradient);
    });
}
