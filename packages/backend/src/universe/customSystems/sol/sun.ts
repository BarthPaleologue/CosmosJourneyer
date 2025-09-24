import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type StarModel } from "@/backend/universe/orbitalObjects/stellarObjects/starModel";

import { degreesToRadians } from "@/utils/physics/unitConversions";

export function getSunModel(): StarModel {
    return {
        id: "sun",
        name: "Sun",
        type: OrbitalObjectType.STAR,
        radius: 695_508e3,
        mass: 1.989e30,
        blackBodyTemperature: 5778,
        axialTilt: degreesToRadians(7.25),
        siderealDaySeconds: 60 * 60 * 24 * 25.67,
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
