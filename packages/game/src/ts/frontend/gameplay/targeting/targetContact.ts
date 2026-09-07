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
