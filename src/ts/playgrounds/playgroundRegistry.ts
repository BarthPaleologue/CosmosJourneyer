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

import { Scene, WebGPUEngine } from "@babylonjs/core";

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
import { createDefaultScene } from "./default";
import { createFlightDemoScene } from "./flightDemo";
import { createGasPlanetScene } from "./gasPlanet";
import { createGrassScene } from "./grass";
import { createHyperspaceTunnelDemo } from "./hyperspaceTunnel";
import { createOrbitalDemoScene } from "./orbitalDemo";
import { createRingsScene } from "./rings";
import { createSaveLoadingPanelContentScene } from "./saveLoadingPanelContent";
import { createJupiterScene } from "./sol/jupiter";
import { createSaturnScene } from "./sol/saturn";
import { createSolScene } from "./sol/sol";
import { createSunScene } from "./sol/sun";
import { createSpaceStationScene } from "./spaceStation";
import { createSpaceStationUIScene } from "./spaceStationUI";
import { createSphericalHeightFieldTerrain } from "./sphericalHeightFieldTerrain";
import { createStarMapScene } from "./starMap";
import { createStarSystemViewScene } from "./starSystemView";
import { createBlackHoleScene } from "./stellarObjects/blackHole";
import { createNeutronStarScene } from "./stellarObjects/neutronStar";
import { createTerrainScene } from "./terrain";
import { createTutorialScene } from "./tutorial";
import { createWarpTunnelScene } from "./warpTunnel";
import { createXrScene } from "./xr";

export class PlaygroundRegistry {
    private readonly map: Map<
        string,
        (engine: WebGPUEngine, progressCallback: (progress: number, text: string) => void) => Promise<Scene>
    > = new Map([
        ["orbitalDemo", createOrbitalDemoScene],
        ["tunnel", createHyperspaceTunnelDemo],
        ["automaticLanding", createAutomaticLandingScene],
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
        ["grass", createGrassScene],
        ["warpTunnel", createWarpTunnelScene],
        ["saveLoadingPanelContent", createSaveLoadingPanelContentScene],
        ["sun", createSunScene],
        ["terrain", createTerrainScene],
        ["sphericalTerrain", createSphericalHeightFieldTerrain],
    ]);

    register(
        name: string,
        createScene: (
            engine: WebGPUEngine,
            progressCallback: (progress: number, text: string) => void,
        ) => Promise<Scene>,
    ) {
        this.map.set(name, createScene);
    }

    get(
        name: string,
    ): (engine: WebGPUEngine, progressCallback: (progress: number, text: string) => void) => Promise<Scene> {
        return this.map.get(name) ?? createDefaultScene;
    }
}
