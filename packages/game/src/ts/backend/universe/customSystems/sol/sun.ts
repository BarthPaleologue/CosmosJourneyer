import { degreesToRadians, durationToSeconds, kilograms, meters, radians } from "@cosmos-journeyer/physics";
import type { StarModel } from "@cosmos-journeyer/universe-model";

/**
 * @returns Star model for Sol's central star.
 */
export function getSunModel(): StarModel {
    return {
        id: "sun",
        name: "Sun",
        type: "star",
        radius: meters(695_508e3),
        mass: kilograms(1.989e30),
        blackBodyTemperature: 5778,
        spin: {
            siderealPeriod: durationToSeconds({ days: 25.67 }),
            axialTilt: degreesToRadians(7.25),
            axisAzimuth: radians(0),
            initialRotationAngle: radians(0),
        },
        orbit: {
            parentIds: [],
            semiMajorAxis: meters(0),
            eccentricity: 0,
            p: 2,
            plane: {
                inclination: radians(0),
                longitudeOfAscendingNode: radians(0),
            },
            argumentOfPeriapsis: radians(0),
            initialMeanAnomaly: radians(0),
        },
        rings: null,
        seed: 0,
    };
}
