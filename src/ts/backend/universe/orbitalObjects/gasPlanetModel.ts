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

import { type RGBColor } from "@/utils/colors";

import { type AtmosphereModel } from "./atmosphereModel";
import { type HasSeed } from "./hasSeed";
import { type CelestialBodyModelBase } from "./orbitalObjectModelBase";
import { type OrbitalObjectType } from "./orbitalObjectType";
import { type RingsModel } from "./ringsModel";

export type GasPlanetProceduralColorPalette = {
    type: "procedural";
    color1: RGBColor;
    color2: RGBColor;
    color3: RGBColor;
    colorSharpness: number;
};

export type GasPlanetTextureId = "jupiter" | "saturn" | "uranus" | "neptune";

export type GasPlanetTexturedColorPalette = {
    type: "textured";
    textureId: GasPlanetTextureId;
};

export type GasPlanetColorPalette = GasPlanetProceduralColorPalette | GasPlanetTexturedColorPalette;

export type GasPlanetModel = CelestialBodyModelBase<OrbitalObjectType.GAS_PLANET> &
    HasSeed & {
        atmosphere: AtmosphereModel & {
            /**
             * For gas giants, the surface is defined by the height at which the pressure is equal to 100,000 Pa (1 bar).
             */
            seaLevelPressure: 100_000;
        };
        rings: RingsModel | null;
        colorPalette: GasPlanetColorPalette;
    };
