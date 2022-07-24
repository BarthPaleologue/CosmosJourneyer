import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { smoothstep, tanhSharpen } from "../utils/gradientMath";
import { mountainLayer } from "./landscape/mountainLayer";
import { continentLayer } from "./landscape/continentLayer";
import { zeroLayer } from "./landscape/constantLayers";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continents = continentLayer(settings.continentsFrequency, 6);
    const bumps = simplexNoiseLayer(settings.bumpsFrequency, 8, 2, 2, 1.0, 0.0);
    const mountains = mountainLayer(settings.mountainsFrequency, 7, 1.8, 2.0, 1, settings.mountainsMinValue);

    return (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        const continentGradient = LVector3.Zero();
        let continentMask = continents(samplePoint, seed, continentGradient);
        continentMask = smoothstep(settings.continentsFragmentation, 1.1, continentMask, continentGradient)

        const continentElevation = continentMask;

        elevation += continentElevation * settings.continentBaseHeight;
        continentGradient.scaleInPlace(settings.continentBaseHeight);

        outGradient.addInPlace(continentGradient);

        const mountainGradient = LVector3.Zero();
        const mountainElevation = mountains(samplePoint, seed, mountainGradient);

        elevation += smoothstep(0.0, 0.5, continentMask) * mountainElevation * settings.maxMountainHeight;
        mountainGradient.scaleInPlace(settings.maxMountainHeight * smoothstep(0.0, 0.5, continentMask));

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
