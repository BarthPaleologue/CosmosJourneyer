import { StarSystemController } from "./starSystemController";
import { StellarObject } from "../stellarObjects/stellarObject";
import { StarModel } from "../stellarObjects/star/starModel";
import { Star } from "../stellarObjects/star/star";
import { starName } from "../utils/parseToStrings";
import { MandelbulbModel } from "../mandelbulb/mandelbulbModel";
import { Mandelbulb } from "../mandelbulb/mandelbulb";
import { romanNumeral } from "../utils/nameGenerator";
import { BlackHoleModel } from "../stellarObjects/blackHole/blackHoleModel";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { NeutronStarModel } from "../stellarObjects/neutronStar/neutronStarModel";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { BODY_TYPE } from "../model/common";
import { TelluricPlanemoModel } from "../planemos/telluricPlanemo/telluricPlanemoModel";
import { TelluricPlanemo } from "../planemos/telluricPlanemo/telluricPlanemo";
import { GasPlanetModel } from "../planemos/gasPlanet/gasPlanetModel";
import { GasPlanet } from "../planemos/gasPlanet/gasPlanet";
import { Planemo } from "../planemos/planemo";
import { getMoonSeed } from "../planemos/common";

export class StarSystemHelper {
    public static makeStar(starsystem: StarSystemController, model?: number | StarModel): Star {
        if (model === undefined) {
            model = starsystem.model.getStarSeed(starsystem.stellarObjects.length);
        }
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const star = new Star(name, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addStellarObject(star);
        return star;
    }

    public static makeMandelbulb(starsystem: StarSystemController, model: number | MandelbulbModel = starsystem.model.getPlanetSeed(starsystem.mandelbulbs.length)): Mandelbulb {
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
    public static makeBlackHole(starsystem: StarSystemController, model: number | BlackHoleModel = starsystem.model.getStarSeed(starsystem.stellarObjects.length)): BlackHole {
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const blackHole = new BlackHole(name, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addStellarObject(blackHole);
        return blackHole;
    }

    public static makeNeutronStar(starsystem: StarSystemController, model: number | NeutronStarModel = starsystem.model.getStarSeed(starsystem.stellarObjects.length)): NeutronStar {
        if (starsystem.stellarObjects.length >= starsystem.model.getNbStars())
            console.warn(`You are adding a neutron star
        to a system that already has ${starsystem.stellarObjects.length} stars.
        The capacity of the generator was supposed to be ${starsystem.model.getNbStars()} starsystem is not a problem, but it may be.`);
        const name = starName(starsystem.model.getName(), starsystem.stellarObjects.length);
        const neutronStar = new NeutronStar(name, starsystem.scene, model, starsystem.stellarObjects[0]);

        starsystem.addStellarObject(neutronStar);
        return neutronStar;
    }

    /**
     * Makes a star and adds it to the system. By default, it will use the next available seed planned by the system model
     * @param starsystem
     * @param seed The seed to use for the star generation (by default, the next available seed planned by the system model)
     */
    public static makeStellarObject(starsystem: StarSystemController, seed: number = starsystem.model.getStarSeed(starsystem.stellarObjects.length)): StellarObject {
        const isStellarObjectBlackHole = starsystem.model.getBodyTypeOfStar(starsystem.stellarObjects.length) === BODY_TYPE.BLACK_HOLE;
        if (isStellarObjectBlackHole) return StarSystemHelper.makeBlackHole(starsystem, seed);
        else return this.makeStar(starsystem, seed);
    }

    /**
     * Makes n stars and adds them to the system. By default, it will use the next available seeds planned by the system model
     * @param starsystem
     * @param n The number of stars to make (by default, the number of stars planned by the system model)
     */
    public static makeStellarObjects(starsystem: StarSystemController, n = starsystem.model.getNbStars()): void {
        if (n < 1) throw new Error("Cannot make less than 1 star");
        for (let i = 0; i < n; i++) StarSystemHelper.makeStellarObject(starsystem);
    }

    /**
     * Makes a telluric planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param starsystem
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public static makeTelluricPlanet(starsystem: StarSystemController, model: number | TelluricPlanemoModel = starsystem.model.getPlanetSeed(starsystem.planets.length)): TelluricPlanemo {
        const planet = new TelluricPlanemo(`${starsystem.model.getName()} ${romanNumeral(starsystem.planets.length + 1)}`, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addTelluricPlanet(planet);
        return planet;
    }

    /**
     * Makes a gas planet and adds it to the system. By default, it will use the next available model planned by the system model
     * @param starsystem
     * @param model The model or seed to use for the planet generation (by default, the next available seed planned by the system model)
     */
    public static makeGasPlanet(starsystem: StarSystemController, model: number | GasPlanetModel = starsystem.model.getPlanetSeed(starsystem.planets.length)): GasPlanet {
        const planet = new GasPlanet(`${starsystem.model.getName()} ${romanNumeral(starsystem.planets.length + 1)}`, starsystem.scene, model, starsystem.stellarObjects[0]);
        starsystem.addGasPlanet(planet);
        return planet;
    }

    public static makePlanets(starsystem: StarSystemController, n: number): void {
        console.assert(n >= 0, `Cannot make a negative amount of planets : ${n}`);

        for (let i = 0; i < n; i++) {
            switch (starsystem.model.getBodyTypeOfPlanet(starsystem.planets.length)) {
                case BODY_TYPE.TELLURIC:
                    StarSystemHelper.makeSatellites(starsystem, StarSystemHelper.makeTelluricPlanet(starsystem));
                    break;
                case BODY_TYPE.GAS:
                    StarSystemHelper.makeSatellites(starsystem, StarSystemHelper.makeGasPlanet(starsystem));
                    break;
                case BODY_TYPE.MANDELBULB:
                    StarSystemHelper.makeSatellites(starsystem, StarSystemHelper.makeMandelbulb(starsystem));
                    break;
                default:
                    throw new Error(`Unknown body type ${starsystem.model.getBodyTypeOfPlanet(starsystem.planets.length)}`);
            }
        }
    }

    public static makeSatellite(
        starsystem: StarSystemController,
        planet: Planemo,
        model: TelluricPlanemoModel | number = getMoonSeed(planet.model, planet.model.childrenBodies.length)
    ): TelluricPlanemo {
        const satellite = new TelluricPlanemo(`${planet.name} ${romanNumeral(planet.model.childrenBodies.length + 1)}`, starsystem.scene, model, planet);

        satellite.material.colorSettings.desertColor.copyFromFloats(92 / 255, 92 / 255, 92 / 255);
        satellite.material.updateConstants();

        planet.model.childrenBodies.push(satellite.model);

        starsystem.addTelluricSatellite(satellite);
        return satellite;
    }

    /**
     * Makes n more satellites for the given planet. By default, it will make as many as the planet has in the generation.
     * You can make more, but it will generate warnings and might cause issues.
     * @param starsystem
     * @param planet The planet to make satellites for
     * @param n The number of satellites to make
     */
    public static makeSatellites(starsystem: StarSystemController, planet: Planemo, n = planet.model.nbMoons): void {
        if (n < 0) throw new Error(`Cannot make a negative amount of satellites : ${n}`);
        if (planet.model.childrenBodies.length + n > planet.model.nbMoons)
            console.warn(
                `You are making more satellites than the planet had planned in its the generation: 
            You want ${n} more which will amount to a total ${planet.model.childrenBodies.length + n}. 
            The generator had planned ${planet.model.nbMoons}.
            starsystem might cause issues, or not who knows. 
            You can just leave starsystem argument empty to make as many as the planet had planned.`
            );

        for (let i = 0; i < n; i++) StarSystemHelper.makeSatellite(starsystem, planet, getMoonSeed(planet.model, planet.model.childrenBodies.length));
    }

    /**
     * Generates the system using the seed provided in the constructor
     */
    public static generate(starsystem: StarSystemController) {
        StarSystemHelper.makeStellarObjects(starsystem, starsystem.model.getNbStars());
        StarSystemHelper.makePlanets(starsystem, starsystem.model.getNbPlanets());
    }
}
