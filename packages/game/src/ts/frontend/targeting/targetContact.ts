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

/**
 * Associates a target with how it became available to the player.
 * @param target Target represented by the contact.
 * @param acquisition Whether it is known directly or detected by sensors.
 * @returns Contact data used by the targeting system.
 */
export function createTargetContact(target: Target, acquisition: TargetAcquisition): TargetContact {
    return {
        target,
        acquisition,
    };
}

/**
 * Creates a contact using the default acquisition policy for its target type.
 * @param target Target whose type determines its default acquisition state.
 * @returns Contact initialized as known or sensor-detected.
 */
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
