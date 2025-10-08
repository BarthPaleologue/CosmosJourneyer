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

import { type DarkKnightModel } from "./anomalies/darkKnightModel";
import { type JuliaSetModel } from "./anomalies/juliaSetModel";
import { type MandelboxModel } from "./anomalies/mandelboxModel";
import { type MandelbulbModel } from "./anomalies/mandelbulbModel";
import { type MengerSpongeModel } from "./anomalies/mengerSpongeModel";
import { type SierpinskiPyramidModel } from "./anomalies/sierpinskiPyramidModel";
import { type GasPlanetModel } from "./gasPlanetModel";
import { type SpaceElevatorModel } from "./orbitalFacilities/spaceElevatorModel";
import { type SpaceStationModel } from "./orbitalFacilities/spacestationModel";
import { type OrbitalObjectModelBase } from "./orbitalObjectModelBase";
import { type BlackHoleModel } from "./stellarObjects/blackHoleModel";
import { type NeutronStarModel } from "./stellarObjects/neutronStarModel";
import { type StarModel } from "./stellarObjects/starModel";
import { type TelluricPlanetModel } from "./telluricPlanetModel";
import { type TelluricSatelliteModel } from "./telluricSatelliteModel";

export type StellarObjectModel = StarModel | NeutronStarModel | BlackHoleModel;

export type PlanetModel = TelluricPlanetModel | GasPlanetModel;

export type PlanetaryMassObjectModel = PlanetModel | TelluricSatelliteModel;

export type AnomalyModel =
    | MandelbulbModel
    | JuliaSetModel
    | MandelboxModel
    | SierpinskiPyramidModel
    | MengerSpongeModel
    | DarkKnightModel;

export type AnomalyType = AnomalyModel["type"];

export type CelestialBodyModel = StellarObjectModel | PlanetaryMassObjectModel | AnomalyModel;

export type OrbitalFacilityModel = SpaceStationModel | SpaceElevatorModel;

export type CustomObjectModel = OrbitalObjectModelBase<"custom">;

export type OrbitalObjectModel = CelestialBodyModel | OrbitalFacilityModel | CustomObjectModel;

export type OrbitalObjectType = OrbitalObjectModel["type"];
