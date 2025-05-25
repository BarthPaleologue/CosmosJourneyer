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

import { AbstractEngine, Scene } from "@babylonjs/core";

import { createJuliaSetScene } from "./anomalies/juliaSet";
import { createMandelboxScene } from "./anomalies/mandelbox";
import { createMandelbulbScene } from "./anomalies/mandelbulb";
import { createMengerSpongeScene } from "./anomalies/mengerSponge";
import { createSierpinskiScene } from "./anomalies/sierpinski";
import { createAsteroidFieldScene } from "./asteroidField";
import { createAtmosphericScatteringScene } from "./atmosphericScattering";
import { createAutomaticLandingScene } from "./automaticLanding";
import { createCharacterDemoScene } from "./character";
import { createDarkKnightScene } from "./darkKnight";
import { createDebugAssetsScene } from "./debugAssets";
import { createDefaultScene } from "./default";
import { createFlightDemoScene } from "./flightDemo";
import { createGasPlanetScene } from "./gasPlanet";
import { createHyperspaceTunnelDemo } from "./hyperspaceTunnel";
import { createOrbitalDemoScene } from "./orbitalDemo";
import { createRingsScene } from "./rings";
import { createJupiterScene } from "./sol/jupiter";
import { createSaturnScene } from "./sol/saturn";
import { createSolScene } from "./sol/sol";
import { createSpaceStationScene } from "./spaceStation";
import { createSpaceStationUIScene } from "./spaceStationUI";
import { createStarMapScene } from "./starMap";
import { createStarSystemViewScene } from "./starSystemView";
import { createBlackHoleScene } from "./stellarObjects/blackHole";
import { createNeutronStarScene } from "./stellarObjects/neutronStar";
import { createTutorialScene } from "./tutorial";
import { createXrScene } from "./xr";

export class PlaygroundRegistry {
    private readonly map: Map<
        string,
        (engine: AbstractEngine, progressCallback: (progress: number, text: string) => void) => Promise<Scene>
    > = new Map([
        ["orbitalDemo", createOrbitalDemoScene],
        ["tunnel", createHyperspaceTunnelDemo],
        ["automaticLanding", createAutomaticLandingScene],
        ["debugAssets", createDebugAssetsScene],
        ["spaceStation", createSpaceStationScene],
        ["spaceStationUI", createSpaceStationUIScene],
        ["xr", createXrScene],
        ["flightDemo", createFlightDemoScene],
        ["neutronStar", createNeutronStarScene],
        ["character", createCharacterDemoScene],
        ["starMap", createStarMapScene],
        ["tutorial", createTutorialScene],
        ["asteroidField", createAsteroidFieldScene],
        ["starSystemView", createStarSystemViewScene],
        ["rings", createRingsScene],
        ["sierpinski", createSierpinskiScene],
        ["mandelbox", createMandelboxScene],
        ["mandelbulb", createMandelbulbScene],
        ["juliaSet", createJuliaSetScene],
        ["mengerSponge", createMengerSpongeScene],
        ["atmosphericScattering", createAtmosphericScatteringScene],
        ["darkKnight", createDarkKnightScene],
        ["blackHole", createBlackHoleScene],
        ["gasPlanet", createGasPlanetScene],
        ["jupiter", createJupiterScene],
        ["saturn", createSaturnScene],
        ["sol", createSolScene],
    ]);

    register(
        name: string,
        createScene: (
            engine: AbstractEngine,
            progressCallback: (progress: number, text: string) => void,
        ) => Promise<Scene>,
    ) {
        this.map.set(name, createScene);
    }

    get(
        name: string,
    ): (engine: AbstractEngine, progressCallback: (progress: number, text: string) => void) => Promise<Scene> {
        return this.map.get(name) ?? createDefaultScene;
    }
}
