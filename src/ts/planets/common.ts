//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { centeredRand } from "extended-random";
import { Settings } from "../settings";
import { PlanetModel } from "../architecture/planet";
import { CelestialBodyModel, CelestialBodyType } from "../architecture/celestialBody";
import { GenerationSteps } from "../utils/generationSteps";
import { romanNumeral } from "../utils/romanNumerals";
import { Alphabet } from "../utils/parseToStrings";
import { getRngFromSeed } from "../utils/getRngFromSeed";

export function getMoonSeed(model: PlanetModel, index: number) {
    if (index > model.nbMoons) throw new Error("Moon out of bound! " + index);
    const rng = getRngFromSeed(model.seed);
    return centeredRand(rng, GenerationSteps.MOONS + index) * Settings.SEED_HALF_RANGE;
}

export function getSpaceStationSeed(model: CelestialBodyModel, index: number) {
    const rng = getRngFromSeed(model.seed);
    return centeredRand(rng, GenerationSteps.SPACE_STATIONS + index) * Settings.SEED_HALF_RANGE;
}

export function getPlanetName(planetIndex: number, starSystemName: string, parentBody: CelestialBodyModel | null): string {
    if (parentBody === null) {
        return `${starSystemName} Rogue`;
    }

    const isSatellite = parentBody.bodyType === CelestialBodyType.TELLURIC_PLANET || parentBody.bodyType === CelestialBodyType.GAS_PLANET;

    if (planetIndex === -1) throw new Error("Planet not found in star system");

    if (isSatellite) {
        return `${parentBody.name}${Alphabet[planetIndex]}`;
    }

    return `${starSystemName} ${romanNumeral(planetIndex + 1)}`;
}
