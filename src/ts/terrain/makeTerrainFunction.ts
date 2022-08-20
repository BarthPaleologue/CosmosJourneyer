import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { minimumValue, multiply, pow, smoothstep } from "../utils/gradientMath";
import { mountainLayer } from "./landscape/mountainLayer";
import { continentLayer } from "./landscape/continentLayer";
import { oneLayer, zeroLayer } from "./landscape/constantLayers";
import { ridgedNoiseLayer } from "./landscape/ridgedNoiseLayer";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continents = continentLayer(settings.continentsFrequency, 6);
    const bumps = simplexNoiseLayer(settings.bumpsFrequency, 8, 1.7, 2, 1.0);
    const mountains = mountainLayer(settings.mountainsFrequency, 1.8, 2.0, 0.8);
    //const mountainMaskLayer = ridgedNoiseLayer(settings.continentsFrequency, 3, 1.5, 2.0, 2.0);
    //const terraceMask = simplexNoiseLayer(settings.mountainsFrequency / 20, 1, 2, 2, 1.0);

    return (unitSamplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        // Continent Generation

        const continentMaskGradient = LVector3.Zero();
        let continentMask = continents(unitSamplePoint, seed, continentMaskGradient);
        continentMask = smoothstep(settings.continentsFragmentation, settings.continentsFragmentation + 0.2, continentMask, continentMaskGradient);

        elevation += continentMask * settings.continentBaseHeight;
        outGradient.addInPlace(continentMaskGradient.scale(settings.continentBaseHeight));

        // Mountain Generation

        //const mountainMaskGradient = LVector3.Zero();
        //const mountainMask = mountainMaskLayer(unitSamplePoint, seed, mountainMaskGradient);

        const mountainGradient = LVector3.Zero();
        let mountainElevation = mountains(unitSamplePoint, seed, mountainGradient);

        //continentMask = smoothstep(0.65, 1.0, continentMask, continentMaskGradient);

        //mountainElevation = multiply(mountainElevation, mountainMask, mountainGradient, mountainMaskGradient);
        mountainElevation = multiply(mountainElevation, continentMask, mountainGradient, continentMaskGradient);

        //mountainElevation = minimumValue(mountainElevation, 0.3, mountainGradient);

        // Terrace Generation

        // terraces are interesting but require lots of polygons to look good
        /*const terraceGradient = mountainGradient.clone();
        let terraceElevation = smoothstep(0.51, 0.52, mountainElevation, terraceGradient);

        const terraceElevationMaskGradient = LVector3.Zero();
        let terraceElevationMask = terraceMask(samplePoint, seed, terraceElevationMaskGradient);
        terraceElevationMask = smoothstep(0.40, 0.41, terraceElevationMask, terraceGradient);

        terraceElevation = multiply(terraceElevation, terraceElevationMask, terraceGradient, terraceElevationMaskGradient);

        mountainElevation += 0.1 * terraceElevation;
        mountainGradient.addInPlace(terraceGradient.scaleInPlace(0.1));*/

        elevation += mountainElevation * settings.maxMountainHeight;
        outGradient.addInPlace(mountainGradient.scaleInPlace(settings.maxMountainHeight));

        // Bump Generation

        const bumpyGradient = LVector3.Zero();
        const bumpyElevation = bumps(unitSamplePoint, seed, bumpyGradient);

        elevation += bumpyElevation * settings.maxBumpHeight;
        outGradient.addInPlace(bumpyGradient.scaleInPlace(settings.maxBumpHeight));

        outPosition.addInPlace(unitSamplePoint.scale(elevation));

        outGradient.divideInPlace(settings.continentBaseHeight + settings.maxMountainHeight + settings.maxBumpHeight);
    };
}
