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

import { DarkKnight } from "../anomalies/darkKnight/darkKnight";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { SpaceElevator } from "../spacestation/spaceElevator";
import { SpaceStation } from "../spacestation/spaceStation";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { Star } from "../stellarObjects/star/star";
import { CustomOrbitalObject } from "../utils/customOrbitalObject";
import { EmptyCelestialBody } from "../utils/emptyCelestialBody";
import { OrbitalObjectType } from "./orbitalObjectType";

export type StellarObject = Star | NeutronStar | BlackHole;

export type Planet = TelluricPlanet | GasPlanet;

export type Anomaly =
    | EmptyCelestialBody<OrbitalObjectType.MENGER_SPONGE>
    | EmptyCelestialBody<OrbitalObjectType.MANDELBULB>
    | EmptyCelestialBody<OrbitalObjectType.JULIA_SET>
    | EmptyCelestialBody<OrbitalObjectType.SIERPINSKI_PYRAMID>
    | EmptyCelestialBody<OrbitalObjectType.MANDELBOX>
    | DarkKnight;

export type OrbitalFacility = SpaceStation | SpaceElevator;

export type CelestialBody = StellarObject | Planet | Anomaly;

/**
 * Describes all objects that can have an orbital trajectory and rotate on themselves
 */
export type OrbitalObject = CelestialBody | OrbitalFacility | CustomOrbitalObject;
