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
import { CelestialBodyModel } from "../architecture/celestialBody";
import { GenerationSteps } from "../utils/generationSteps";
import { BodyType } from "../architecture/bodyType";
import { romanNumeral } from "../utils/romanNumerals";
import { StarSystemModel } from "../starSystem/starSystemModel";
import { Alphabet } from "../utils/parseToStrings";

export function getMoonSeed(model: PlanetModel, index: number) {
    if (index > model.nbMoons) throw new Error("Moon out of bound! " + index);
    return centeredRand(model.rng, GenerationSteps.MOONS + index) * Settings.SEED_HALF_RANGE;
}

export function getMoonSeeds(model: PlanetModel) {
    return Array.from({ length: model.nbMoons }, (_, index) => getMoonSeed(model, index));
}

export function getSpaceStationSeed(model: CelestialBodyModel, index: number) {
    return centeredRand(model.rng, GenerationSteps.SPACE_STATIONS + index) * Settings.SEED_HALF_RANGE;
}

export function getPlanetName(seed: number, starSystemModel: StarSystemModel, parentBody: CelestialBodyModel | null): string {
    if (parentBody === null) {
        return `${starSystemModel.name} Rogue`;
    }

    const isSatellite = parentBody.bodyType === BodyType.TELLURIC_PLANET || parentBody.bodyType === BodyType.GAS_PLANET;

    const planetIndex = !isSatellite
        ? starSystemModel.getPlanets().findIndex(([_, planetSeed]) => planetSeed === seed)
        : getMoonSeeds(parentBody as PlanetModel).findIndex((moonSeed) => moonSeed === seed);

    if (planetIndex === -1) throw new Error("Planet not found in star system");

    if (isSatellite) {
        return `${parentBody.name}${Alphabet[planetIndex]}`;
    }

    return `${starSystemModel.name} ${romanNumeral(planetIndex + 1)}`;
}
