//  This file is part of CosmosJourneyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Computes the mean temperature of a planet given the properties of its star and itself
 * @param starTemperature The temperature of the star
 * @param starRadius The radius of the star
 * @param starDistance The distance between the planet and the star
 * @param planetAlbedo The albedo of the planet
 * @param planetGreenHouseEffect The greenhouse effect of the planet
 */
export function computeMeanTemperature(starTemperature: number, starRadius: number, starDistance: number, planetAlbedo: number, planetGreenHouseEffect: number) {
    return starTemperature * Math.pow(((1 - planetAlbedo) * starRadius ** 2) / (4 * (1 - planetGreenHouseEffect) * starDistance ** 2), 0.25);
}
