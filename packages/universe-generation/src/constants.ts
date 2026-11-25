import { kilograms, meters } from "@cosmos-journeyer/physics";

export const ScaledEarthRadius = meters(1_000e3);

export const CloudLayerHeight = meters(7e3);

export const SeedHalfRange = 1e4;

/** Provisional mass in kg for the 200–1000 km orbital anomalies. */
export const DefaultAnomalyMass = kilograms(1e20);
