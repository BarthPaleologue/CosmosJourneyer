import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { multiply, smoothstep } from "../utils/gradientMath";
import { mountainLayer } from "./landscape/mountainLayer";
import { continentLayer } from "./landscape/continentLayer";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continents = continentLayer(settings.continentsFrequency, 6);
    const bumps = simplexNoiseLayer(settings.bumpsFrequency, 8, 2, 2, 1.0, 0.0);
    const mountains = mountainLayer(settings.mountainsFrequency, 7, 1.8, 2.0, 0.8, 0.0);

    return (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        const continentMaskGradient = LVector3.Zero();
        let continentMask = continents(samplePoint, seed, continentMaskGradient);
        continentMask = smoothstep(settings.continentsFragmentation, 1.1, continentMask, continentMaskGradient);

        elevation += continentMask * settings.continentBaseHeight;
        outGradient.addInPlace(continentMaskGradient.scale(settings.continentBaseHeight));

        const mountainGradient = LVector3.Zero();
        let mountainElevation = mountains(samplePoint, seed, mountainGradient);

        mountainElevation = multiply(mountainElevation, smoothstep(0.0, 0.5, continentMask), mountainGradient, continentMaskGradient);

        //const terraceGradient = mountainGradient.clone();
        //mountainElevation += 0.1 * smoothstep(0.5970000000001, 0.5970000000002, mountainElevation, terraceGradient);
        //mountainGradient.addInPlace(terraceGradient.scaleInPlace(0.1));

        elevation += mountainElevation * settings.maxMountainHeight;
        outGradient.addInPlace(mountainGradient.scaleInPlace(settings.maxMountainHeight));

        const bumpyGradient = LVector3.Zero();
        const bumpyElevation = bumps(samplePoint, seed, bumpyGradient);

        elevation += bumpyElevation * settings.maxBumpHeight;
        bumpyGradient.scaleInPlace(settings.maxBumpHeight);

        outGradient.addInPlace(bumpyGradient);

        outPosition.addInPlace(samplePoint.scale(elevation));

        outGradient.divideInPlace(settings.continentBaseHeight + settings.maxMountainHeight + settings.maxBumpHeight);
    };
}
