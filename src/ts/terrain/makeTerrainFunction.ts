import { TerrainSettings } from "./terrainSettings";
import { simplexNoiseLayer } from "./landscape/simplexNoiseLayer";
import { LVector3 } from "../utils/algebra";
import { multiply, smoothstep } from "../utils/gradientMath";
import { mountainLayer } from "./landscape/mountainLayer";
import { continentLayer } from "./landscape/continentLayer";
import { oneLayer, zeroLayer } from "./landscape/constantLayers";

export type TerrainFunction = (samplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3) => void;

export function makeTerrainFunction(settings: TerrainSettings): TerrainFunction {
    const continents = continentLayer(settings.continents_frequency, 6);
    const bumps = simplexNoiseLayer(settings.bumps_frequency, 8, 1.7, 2, 1.0);
    const mountains = mountainLayer(settings.mountains_frequency, 7, 1.8, 2.0, 0.8);
    //const terraceMask = simplexNoiseLayer(settings.mountainsFrequency / 20, 1, 2, 2, 1.0);

    return (unitSamplePoint: LVector3, seed: number, outPosition: LVector3, outGradient: LVector3): void => {
        let elevation = 0;

        // Continent Generation

        const continentMaskGradient = LVector3.Zero();
        let continentMask = continents(unitSamplePoint, seed, continentMaskGradient);
        continentMask = smoothstep(settings.continents_fragmentation, 1.1, continentMask, continentMaskGradient);

        elevation += continentMask * settings.continent_base_height;
        outGradient.addInPlace(continentMaskGradient.scale(settings.continent_base_height));

        // Mountain Generation

        const mountainGradient = LVector3.Zero();
        let mountainElevation = mountains(unitSamplePoint, seed, mountainGradient);

        mountainElevation = multiply(mountainElevation, smoothstep(0.0, 0.5, continentMask), mountainGradient, continentMaskGradient);

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

        elevation += mountainElevation * settings.max_mountain_height;
        outGradient.addInPlace(mountainGradient.scaleInPlace(settings.max_mountain_height));

        // Bump Generation

        const bumpyGradient = LVector3.Zero();
        const bumpyElevation = bumps(unitSamplePoint, seed, bumpyGradient);

        elevation += bumpyElevation * settings.max_bump_height;
        outGradient.addInPlace(bumpyGradient.scaleInPlace(settings.max_bump_height));

        outPosition.addInPlace(unitSamplePoint.scale(elevation));

        outGradient.divideInPlace(settings.continent_base_height + settings.max_mountain_height + settings.max_bump_height);
    };
}
