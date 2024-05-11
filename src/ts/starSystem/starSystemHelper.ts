//  This file is part of Cosmos Journeyer
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

import { StarSystemController } from "./starSystemController";
import { StarModel } from "../stellarObjects/star/starModel";
import { Star } from "../stellarObjects/star/star";
import { starName } from "../utils/parseToStrings";
import { MandelbulbModel } from "../mandelbulb/mandelbulbModel";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { TelluricPlanetModel } from "../planets/telluricPlanet/telluricPlanetModel";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { GasPlanetModel } from "../planets/gasPlanet/gasPlanetModel";
import { GasPlanet } from "../planets/gasPlanet/gasPlanet";
import { getMoonSeed, getSpaceStationSeed } from "../planets/common";
import { Planet } from "../architecture/planet";
import { StellarObject } from "../architecture/stellarObject";
import { SpaceStation } from "../spacestation/spaceStation";
import { CelestialBody } from "../architecture/celestialBody";
import { romanNumeral } from "../utils/romanNumerals";
import { SpaceStationModel } from "../spacestation/spacestationModel";
import { BodyType } from "../architecture/bodyType";

export class StarSystemHelper {
    public static MakeStar(starsystem: StarSystemController, model?: number | StarModel): Star {
        if (model === undefined) {
            model = starsystem.model.getStellarObjectSeed(starsystem.stellarObjects.length);
        }
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const star = new Star(name, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addStellarObject(star);
        return star;
    }

    public static MakeMandelbulb(starsystem: StarSystemController, model: number | MandelbulbModel = starsystem.model.getPlanetSeed(starsystem.mandelbulbs.length)): Mandelbulb {
        if (starsystem.planets.length >= starsystem.model.getNbPlanets())
            console.warn(`You are adding a mandelbulb to the system.
            The system generator had planned for ${starsystem.model.getNbPlanets()} planets, but you are adding the ${starsystem.planets.length + 1}th planet.
            starsystem might cause issues, or not who knows.`);
        const mandelbulb = new Mandelbulb(`${starsystem.model.getName()} ${romanNumeral(starsystem.planets.length + 1)}`, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addMandelbulb(mandelbulb);
        return mandelbulb;
    }

    /**
     * Makes a black hole and adds it to the system. By default, it will use the next available model planned by the system
     * @param starsystem
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public static MakeBlackHole(
        starsystem: StarSystemController,
        model: number | BlackHoleModel = starsystem.model.getStellarObjectSeed(starsystem.stellarObjects.length)
    ): BlackHole {
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const blackHole = new BlackHole(name, starsystem.scene, model, starsystem.stellarObjects.length > 0 ? starsystem.stellarObjects[0] : null);
        starsystem.addStellarObject(blackHole);
        return blackHole;
    }

    public static MakeNeutronStar(
        starsystem: StarSystemController,
        model: number | NeutronStarModel = starsystem.model.getStellarObjectSeed(starsystem.stellarObjects.length)
    ): NeutronStar {
        if (starsystem.stellarObjects.length >= starsystem.model.getNbStellarObjects())
            console.warn(`You are adding a neutron star
        to a system that already has ${starsystem.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${starsystem.model.getNbStellarObjects()} starsystem is not a problem, but it may be.`);
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const neutronStar = new NeutronStar(name, starsystem.scene, model, starsystem.stellarObjects.length > 0 ? starsystem.stellarObjects[0] : null);

        starsystem.addStellarObject(neutronStar);
        return neutronStar;
    }

    /**
     * Makes a star and adds it to the system. By default, it will use the next available seed planned by the system model
     * @param starsystem
     * @param seed The seed to use for the star generation (by default, the next available seed planned by the system model)
     */
    public static MakeStellarObject(starsystem: StarSystemController, seed: number = starsystem.model.getStellarObjectSeed(starsystem.stellarObjects.length)): StellarObject {
        const stellarObjectType = starsystem.model.getBodyTypeOfStellarObject(starsystem.stellarObjects.length);
        if (stellarObjectType === BodyType.BLACK_HOLE) {
            const blackHole = StarSystemHelper.MakeBlackHole(starsystem, seed);
            StarSystemHelper.MakeSpaceStations(starsystem, blackHole);
            return blackHole;
        } else if (stellarObjectType === BodyType.NEUTRON_STAR) {
            const neutronStar = StarSystemHelper.MakeNeutronStar(starsystem, seed);
            StarSystemHelper.MakeSpaceStations(starsystem, neutronStar);
            return neutronStar;
        } else if (stellarObjectType === BodyType.STAR) {
            const star = StarSystemHelper.MakeStar(starsystem, seed);
            StarSystemHelper.MakeSpaceStations(starsystem, star);
            return star;
        } else {
            throw new Error(`Unknown stellar object type ${stellarObjectType}`);
        }
    }

    /**
     * Makes n stars and adds them to the system. By default, it will use the next available seeds planned by the system model
     * @param starsystem
     * @param n The number of stars to make (by default, the number of stars planned by the system model)
     */
    public static MakeStellarObjects(starsystem: StarSystemController, n = starsystem.model.getNbStellarObjects()): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) StarSystemHelper.MakeStellarObject(starsystem);
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param starsystem
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public static MakeTelluricPlanet(
        starsystem: StarSystemController,
        model: number | TelluricPlanetModel = starsystem.model.getPlanetSeed(starsystem.planets.length)
    ): TelluricPlanet {
        const planet = new TelluricPlanet(`${starsystem.model.getName()} ${romanNumeral(starsystem.planets.length + 1)}`, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addTelluricPlanet(planet);

        return planet;
    }

    /**
     * Makes a gas planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param starsystem
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public static MakeGasPlanet(starsystem: StarSystemController, model: number | GasPlanetModel = starsystem.model.getPlanetSeed(starsystem.planets.length)): GasPlanet {
        const planet = new GasPlanet(`${starsystem.model.getName()} ${romanNumeral(starsystem.planets.length + 1)}`, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addGasPlanet(planet);
        return planet;
    }

    public static MakePlanets(starsystem: StarSystemController, n: number): void {
        console.assert(n >= 0, `Cannot make a negative amount of planets : ${n}`);

        for (let i = 0; i < n; i++) {
            this.MakePlanet(starsystem);
        }
    }

    public static MakePlanet(starsystem: StarSystemController) {
        const bodyType = starsystem.model.getBodyTypeOfPlanet(starsystem.planets.length);
        if (bodyType === BodyType.TELLURIC_PLANET) {
            const planet = StarSystemHelper.MakeTelluricPlanet(starsystem);
            StarSystemHelper.MakeSatellites(starsystem, planet);
            StarSystemHelper.MakeSpaceStations(starsystem, planet);
        } else if (bodyType === BodyType.GAS_PLANET) {
            const planet = StarSystemHelper.MakeGasPlanet(starsystem);
            StarSystemHelper.MakeSatellites(starsystem, planet);
            StarSystemHelper.MakeSpaceStations(starsystem, planet);
        } else {
            throw new Error(`Unknown body type ${bodyType}`);
        }
    }

    public static MakeSpaceStation(starsystem: StarSystemController, model: SpaceStationModel | number, body: CelestialBody): SpaceStation {
        const spacestation = new SpaceStation(starsystem.scene, model, body);
        starsystem.addSpaceStation(spacestation);
        return spacestation;
    }

    public static MakeSpaceStations(starsystem: StarSystemController, body: CelestialBody, n = body.model.getNbSpaceStations()): SpaceStation[] {
        console.assert(n >= 0, `Cannot make a negative amount of space stations : ${n}`);
        const spaceStations = [];
        for (let i = 0; i < n; i++) {
            const seed = getSpaceStationSeed(body.model, i);
            const spacestation = StarSystemHelper.MakeSpaceStation(starsystem, seed, body);
            spaceStations.push(spacestation);
        }

        return spaceStations;
    }

    public static MakeSatellite(
        starsystem: StarSystemController,
        planet: Planet,
        model: TelluricPlanetModel | number = getMoonSeed(planet.model, planet.model.childrenBodies.length)
    ): TelluricPlanet {
        const satellite = new TelluricPlanet(`${planet.name} ${romanNumeral(planet.model.childrenBodies.length + 1)}`, starsystem.scene, model, planet);

        planet.model.childrenBodies.push(satellite.model);

        starsystem.addTelluricPlanet(satellite);
        return satellite;
    }

    /**
     * Makes n more satellites for the given planet. By default, it will make as many as the planet has in the generation.
     * You can make more, but it will generate warnings and might cause issues.
     * @param starsystem
     * @param planet The planet to make satellites for
     * @param n The number of satellites to make
     */
    public static MakeSatellites(starsystem: StarSystemController, planet: Planet, n = planet.model.nbMoons): TelluricPlanet[] {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        if (planet.model.childrenBodies.length + n > planet.model.nbMoons)
            console.warn(
                `You are making more satellites than the planet had planned in its the generation: 
            You want ${n} more which will amount to a total ${planet.model.childrenBodies.length + n}. 
            The generator had planned ${planet.model.nbMoons}.
            starsystem might cause issues, or not who knows. 
            You can just leave starsystem argument empty to make as many as the planet had planned.`
            );

        const satellites = [];
        for (let i = 0; i < n; i++) {
            satellites.push(StarSystemHelper.MakeSatellite(starsystem, planet, getMoonSeed(planet.model, planet.model.childrenBodies.length)));
        }

        return satellites;
    }

    /**
     * Generates the system using the seed provided in the constructor
     */
    public static Generate(starsystem: StarSystemController) {
        StarSystemHelper.MakeStellarObjects(starsystem, starsystem.model.getNbStellarObjects());
        StarSystemHelper.MakePlanets(starsystem, starsystem.model.getNbPlanets());
    }
}
