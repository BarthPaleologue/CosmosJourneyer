import type { StellarType } from "@cosmos-journeyer/physics";

import type { HasBoundingSphere } from "../../simulation/architecture/hasBoundingSphere";
import type { Transformable } from "../../simulation/architecture/transformable";

export const TargetType = {
    BLACK_HOLE: "blackHole",
    CUSTOM: "custom",
    ANOMALY: "anomaly",
    GAS_PLANET: "gasPlanet",
    LANDING_BAY: "landingBay",
    LANDING_PAD: "landingPad",
    NEUTRON_STAR: "neutronStar",
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

export type PadTarget = TargetBase & {
    readonly type: typeof TargetType.LANDING_PAD;
    readonly padIdentifier: string;
};

type OtherTarget = TargetBase & {
    readonly type: Exclude<
        TargetType,
        typeof TargetType.STAR | typeof TargetType.TELLURIC_SATELLITE | typeof TargetType.LANDING_PAD
    >;
};

export type Target = StarTarget | TelluricSatelliteTarget | PadTarget | OtherTarget;
