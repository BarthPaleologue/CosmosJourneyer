import { degreesToRadians, durationToSeconds } from "@cosmos-journeyer/physics";
import { type StarModel } from "@cosmos-journeyer/universe-model";

export function getSunModel(): StarModel {
    return {
        id: "sun",
        name: "Sun",
        type: "star",
        radius: 695_508e3,
        mass: 1.989e30,
        blackBodyTemperature: 5778,
        rotation: {
            siderealPeriod: durationToSeconds({ days: 25.67 }),
            axialTilt: degreesToRadians(7.25),
            spinAxisAzimuth: 0,
            initialRotationAngle: 0,
        },
        orbit: {
            parentIds: [],
            semiMajorAxis: 0,
            eccentricity: 0,
            p: 2,
            inclination: 0,
            longitudeOfAscendingNode: 0,
            argumentOfPeriapsis: 0,
            initialMeanAnomaly: 0,
        },
        rings: null,
        seed: 0,
    };
}
