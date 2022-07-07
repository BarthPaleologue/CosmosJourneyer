import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { ridgedNoiseLayer } from "./landscape/ridgedNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { tanhSharpen } from "../utils/math";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continentsLayer = simplexNoiseLayer(settings.continentsFrequency, 6, 1.8, 2.1, 0.5, 1 - settings.continentsFragmentation);
    const bumpyLayer = simplexNoiseLayer(settings.bumpsFrequency, 3, 2, 2, 1.0, 0.2);
    const mountainsLayer = ridgedNoiseLayer(settings.mountainsFrequency, 6, 1.9, 2.0, 2, settings.mountainsMinValue);

    return (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        const continentGradient = LVector3.Zero();
        const continentMask = continentsLayer(samplePoint, seed, continentGradient);

        const continentElevation = continentMask * settings.continentBaseHeight;

        elevation += continentElevation;
        continentGradient.scaleInPlace(settings.continentBaseHeight);
        outGradient.addInPlace(continentGradient);

        const mountainGradient = LVector3.Zero();
        let mountainElevation = mountainsLayer(samplePoint, seed, mountainGradient);

        mountainElevation = tanhSharpen(mountainElevation, 3, mountainGradient);

        elevation += continentMask * mountainElevation * settings.maxMountainHeight;
        mountainGradient.scaleInPlace(settings.maxMountainHeight * continentMask);
        outGradient.addInPlace(mountainGradient);

        const bumpyGradient = LVector3.Zero();
        const bumpyElevation = bumpyLayer(samplePoint, seed, bumpyGradient);

        elevation += bumpyElevation * settings.maxBumpHeight;
        bumpyGradient.scaleInPlace(settings.maxBumpHeight);
        outGradient.addInPlace(bumpyGradient);

        outPosition.addInPlace(samplePoint.scale(elevation));

        outGradient.divideInPlace(settings.continentBaseHeight + settings.maxMountainHeight + settings.maxBumpHeight);
    };
}
