import type { StellarType } from "@cosmos-journeyer/physics";

import type { HasBoundingSphere } from "../simulation/architecture/hasBoundingSphere";
import type { Transformable } from "../simulation/architecture/transformable";

export const TargetType = {
    BLACK_HOLE: "blackHole",
    CUSTOM: "custom",
    DARK_KNIGHT: "darkKnight",
    GAS_PLANET: "gasPlanet",
    JULIA_SET: "juliaSet",
    LANDING_BAY: "landingBay",
    LANDING_PAD: "landingPad",
    MANDELBOX: "mandelbox",
    MANDELBULB: "mandelbulb",
    MENGER_SPONGE: "mengerSponge",
    NEUTRON_STAR: "neutronStar",
    SIERPINSKI_PYRAMID: "sierpinskiPyramid",
    SPACE_ELEVATOR: "spaceElevator",
    SPACE_ELEVATOR_CLIMBER: "spaceElevatorClimber",
    SPACE_STATION: "spaceStation",
    STAR_SYSTEM: "starSystem",
    STAR: "star",
    SPACESHIP: "spaceship",
    TELLURIC_PLANET: "telluricPlanet",
    TELLURIC_SATELLITE: "telluricSatellite",
    VEHICLE: "vehicle",
} as const;

export type TargetType = (typeof TargetType)[keyof typeof TargetType];

interface TargetBase extends Transformable, HasBoundingSphere {
    readonly properName?: string;
}

type StarTarget = TargetBase & {
    readonly type: typeof TargetType.STAR;
    readonly stellarType: StellarType;
};

type TelluricSatelliteTarget = TargetBase & {
    readonly type: typeof TargetType.TELLURIC_SATELLITE;
    readonly orbitSemiMajorAxis: number;
};

type OtherTarget = TargetBase & {
    readonly type: Exclude<TargetType, typeof TargetType.STAR | typeof TargetType.TELLURIC_SATELLITE>;
};

export type Target = StarTarget | TelluricSatelliteTarget | OtherTarget;
