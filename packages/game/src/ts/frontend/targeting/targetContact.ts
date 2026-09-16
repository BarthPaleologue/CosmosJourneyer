import { TargetType } from "./target";
import type { Target } from "./target";

export const TargetAcquisition = {
    KNOWN: "known",
    SENSOR: "sensor",
} as const;

export type TargetAcquisition = (typeof TargetAcquisition)[keyof typeof TargetAcquisition];

export type TargetContact = {
    readonly target: Target;
    readonly acquisition: TargetAcquisition;
};

export function createTargetContact(target: Target, acquisition: TargetAcquisition): TargetContact {
    return {
        target,
        acquisition,
    };
}

/** Default acquisition for contacts registered by the player and star system. */
export function createDefaultTargetContact(target: Target): TargetContact {
    const acquisition = defaultAcquisition[target.type];
    return { target, acquisition };
}

const defaultAcquisition = {
    [TargetType.STAR_SYSTEM]: TargetAcquisition.KNOWN,
    [TargetType.STAR]: TargetAcquisition.KNOWN,
    [TargetType.NEUTRON_STAR]: TargetAcquisition.KNOWN,
    [TargetType.BLACK_HOLE]: TargetAcquisition.KNOWN,
    [TargetType.GAS_PLANET]: TargetAcquisition.KNOWN,
    [TargetType.TELLURIC_PLANET]: TargetAcquisition.KNOWN,
    [TargetType.TELLURIC_SATELLITE]: TargetAcquisition.KNOWN,
    [TargetType.CUSTOM]: TargetAcquisition.KNOWN,
    [TargetType.SPACE_STATION]: TargetAcquisition.KNOWN,
    [TargetType.SPACE_ELEVATOR]: TargetAcquisition.KNOWN,
    [TargetType.ANOMALY]: TargetAcquisition.SENSOR,
    [TargetType.LANDING_PAD]: TargetAcquisition.SENSOR,
    [TargetType.LANDING_BAY]: TargetAcquisition.SENSOR,
    [TargetType.SPACE_ELEVATOR_CLIMBER]: TargetAcquisition.SENSOR,
    [TargetType.SPACESHIP]: TargetAcquisition.SENSOR,
    [TargetType.VEHICLE]: TargetAcquisition.SENSOR,
} satisfies Record<TargetType, TargetAcquisition>;
