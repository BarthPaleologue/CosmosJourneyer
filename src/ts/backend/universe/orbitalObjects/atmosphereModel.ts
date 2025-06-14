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

export type Gas = "N2" | "O2" | "Ar" | "CO2" | "He" | "Ne" | "H2" | "CH4" | "SO2";

export type AtmosphereModel = {
    /**
     * The pressure of the atmosphere in Pa at sea level.
     * For Gas giants, this is always 101325 Pa (1 bar) by definition.
     */
    seaLevelPressure: number;

    /**
     * The amount of greenhouse gases in the atmosphere (between 0 and 1)
     */
    greenHouseEffectFactor: number;

    /**
     * The composition of the atmosphere, as a list of gas and its associated Mole/volume fraction.
     * The sum of all fractions must add up to 1.0
     */
    gasMix: Array<[Gas, number]>;
};
