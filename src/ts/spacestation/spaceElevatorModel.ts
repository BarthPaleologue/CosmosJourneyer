import { StellarObjectModel } from "../architecture/stellarObject";
import { StarSystemCoordinates } from "../utils/coordinates/universeCoordinates";
import { CelestialBodyModel } from "../architecture/celestialBody";
import { getRngFromSeed } from "../utils/getRngFromSeed";
import { generateSpaceElevatorName } from "../utils/strings/spaceStationNameGenerator";
import { Orbit } from "../orbit/orbit";
import { OrbitalObjectPhysicsInfo } from "../architecture/physicsInfo";
import { getFactionFromCoordinates } from "../society/factions";
import { randomPieChart } from "../utils/random";
import { CropType, CropTypes, getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { getOrbitRadiusFromPeriod, getSphereRadiatedEnergyFlux } from "../utils/physics";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { Settings } from "../settings";
import { OrbitalObjectType } from "../architecture/orbitalObject";

import { OrbitalFacilityModel } from "./orbitalFacility";
import { Quaternion } from "@babylonjs/core/Maths/math";

export type SpaceElevatorModel = OrbitalFacilityModel & {
    readonly type: OrbitalObjectType.SPACE_ELEVATOR;

    readonly tetherLength: number;
};

export function newSeededSpaceElevatorModel(
    seed: number,
    stellarObjectModels: StellarObjectModel[],
    starSystemCoordinates: StarSystemCoordinates,
    parentBody: CelestialBodyModel
): SpaceElevatorModel {
    const rng = getRngFromSeed(seed);

    const name = generateSpaceElevatorName(rng, 2756);

    const parentSiderealDayDuration = parentBody.physics.siderealDayDuration;

    const orbitRadius = getOrbitRadiusFromPeriod(parentSiderealDayDuration, parentBody.physics.mass);

    const parentAxialTilt: Quaternion = parentBody.physics.axialTilt;

    const orbit: Orbit = {
        radius: orbitRadius,
        p: 2,
        period: parentSiderealDayDuration,
        orientation: parentAxialTilt
    };

    const tetherLength = orbitRadius - parentBody.radius;

    const physicalProperties: OrbitalObjectPhysicsInfo = {
        mass: 1,
        siderealDayDuration: parentSiderealDayDuration,
        axialTilt: parentAxialTilt
    };

    const faction = getFactionFromCoordinates(starSystemCoordinates, rng);

    //TODO: make this dependent on economic model
    const population = 2_000_000;
    const energyConsumptionPerCapitaKWh = 40_000;

    const populationDensity = 4_000;

    const mix = randomPieChart(CropTypes.length, rng, 498);
    const agricultureMix: [number, CropType][] = mix.map((proportion, index) => [proportion, CropTypes[index]]);

    const nbHydroponicLayers = 10;

    // find average distance to stellar objects
    const distanceToStar = parentBody.orbit.radius;

    let totalStellarFlux = 0;
    stellarObjectModels.forEach((stellarObject) => {
        const exposureTimeFraction = 0.5;
        const starRadius = stellarObject.radius;
        const starTemperature = stellarObject.physics.blackBodyTemperature;
        totalStellarFlux += getSphereRadiatedEnergyFlux(starTemperature, starRadius, distanceToStar) * exposureTimeFraction;
    });

    const totalEnergyConsumptionKWh = population * energyConsumptionPerCapitaKWh;

    const solarPanelEfficiency = 0.4;

    const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(solarPanelEfficiency, totalEnergyConsumptionKWh, totalStellarFlux);

    const housingSurfaceHa = (100 * population) / populationDensity; // convert km² to ha
    let agricultureSurfaceHa = 0;
    agricultureMix.forEach(([fraction, cropType]) => {
        agricultureSurfaceHa +=
            (fraction * population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE) /
            (Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO * nbHydroponicLayers * getEdibleEnergyPerHaPerDay(cropType));
    });
    const totalHabitatSurfaceM2 = (housingSurfaceHa + agricultureSurfaceHa) * 1000; // convert ha to m²

    return {
        seed,
        type: OrbitalObjectType.SPACE_ELEVATOR,
        starSystemCoordinates: starSystemCoordinates,
        name,
        orbit,
        physics: physicalProperties,
        tetherLength,
        population,
        energyConsumptionPerCapitaKWh,
        populationDensity,
        agricultureMix,
        nbHydroponicLayers,
        faction,
        totalEnergyConsumptionKWh,
        solarPanelEfficiency,
        solarPanelSurfaceM2,
        housingSurfaceHa,
        agricultureSurfaceHa,
        totalHabitatSurfaceM2
    };
}
