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

import { type OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";

import { type CustomOrbitalObject } from "@/frontend/universe/customOrbitalObject";
import { type BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { type NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";
import { type Star } from "@/frontend/universe/stellarObjects/star/star";

import { type DarkKnight } from "../darkKnight";
import { type EmptyCelestialBody } from "../emptyCelestialBody";
import { type SpaceElevator } from "../orbitalFacility/spaceElevator";
import { type SpaceStation } from "../orbitalFacility/spaceStation";
import { type GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { type TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";

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
