import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { ridgedNoiseLayer } from "./landscape/ridgedNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { tanhSharpen } from "../utils/math";
import { mountainsLayer } from "./landscape/mountainsLayer";
import { oneLayer, zeroLayer } from "./landscape/constantLayers";
import { continentLayer } from "./landscape/continentLayer";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continents = continentLayer(settings.continentsFrequency, 6, settings.continentsFragmentation);
    const bumps = simplexNoiseLayer(settings.bumpsFrequency, 3, 2, 2, 1.0, 0.2);
    const mountains = mountainsLayer(settings.mountainsFrequency, 7, 1.9, 2.0, 2, settings.mountainsMinValue);

    return (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        const continentGradient = LVector3.Zero();
        const continentMask = continents(samplePoint, seed, continentGradient);

        const continentElevation = continentMask * settings.continentBaseHeight;

        elevation += continentElevation;
        continentGradient.scaleInPlace(settings.continentBaseHeight);
        outGradient.addInPlace(continentGradient);

        const mountainGradient = LVector3.Zero();
        let mountainElevation = mountains(samplePoint, seed, mountainGradient);

        mountainElevation = tanhSharpen(mountainElevation, 3, mountainGradient);

        elevation += tanhSharpen(continentMask, 32.0) * mountainElevation * settings.maxMountainHeight;
        mountainGradient.scaleInPlace(settings.maxMountainHeight * tanhSharpen(continentMask, 32.0));
        outGradient.addInPlace(mountainGradient);

        const bumpyGradient = LVector3.Zero();
        const bumpyElevation = bumps(samplePoint, seed, bumpyGradient);

        elevation += bumpyElevation * settings.maxBumpHeight;
        bumpyGradient.scaleInPlace(settings.maxBumpHeight);
        outGradient.addInPlace(bumpyGradient);

        outPosition.addInPlace(samplePoint.scale(elevation));

        outGradient.divideInPlace(settings.continentBaseHeight + settings.maxMountainHeight + settings.maxBumpHeight);
    };
}
