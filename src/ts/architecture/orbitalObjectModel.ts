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

import { DarkKnightModel } from "../anomalies/darkKnight/darkKnightModel";
import { JuliaSetModel } from "../anomalies/julia/juliaSetModel";
import { MandelboxModel } from "../anomalies/mandelbox/mandelboxModel";
import { MandelbulbModel } from "../anomalies/mandelbulb/mandelbulbModel";
import { MengerSpongeModel } from "../anomalies/mengerSponge/mengerSpongeModel";
import { SierpinskiPyramidModel } from "../anomalies/sierpinskiPyramid/sierpinskiPyramidModel";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { TelluricSatelliteModel } from "../planets/telluricPlanet/telluricSatelliteModel";
import { SpaceElevatorModel } from "../spacestation/spaceElevatorModel";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { StarModel } from "../stellarObjects/star/starModel";
import { OrbitalObjectModelBase } from "./orbitalObjectModelBase";
import { OrbitalObjectType } from "./orbitalObjectType";

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

export type CustomObjectModel = OrbitalObjectModelBase<OrbitalObjectType.CUSTOM>;

export type OrbitalObjectModel = CelestialBodyModel | OrbitalFacilityModel | CustomObjectModel;
