import { type HasBoundingSphere } from "./hasBoundingSphere";
import { type Transformable } from "./transformable";
import { type TypedObject } from "./typedObject";

export const ObjectTargetCursorType = {
    CELESTIAL_BODY: "CELESTIAL_BODY",
    FACILITY: "FACILITY",
    ANOMALY: "ANOMALY",
    LANDING_BAY: "LANDING_BAY",
    LANDING_PAD: "LANDING_PAD",
    STAR_SYSTEM: "STAR_SYSTEM",
    SPACESHIP: "SPACESHIP",
} as const;

export type ObjectTargetCursorType = (typeof ObjectTargetCursorType)[keyof typeof ObjectTargetCursorType];

export type TargetInfo = {
    type: ObjectTargetCursorType;

    name: string;

    /**
     * if distance < minDistance, the target cursor is hidden
     */
    minDistance: number;

    /**
     * if distance > maxDistance, the target cursor is hidden
     */
    maxDistance: number;
};

export interface Targetable extends Transformable, HasBoundingSphere, TypedObject {
    readonly targetInfo: TargetInfo;
}

export function defaultTargetInfoCelestialBody(name: string, boundingRadius: number): TargetInfo {
    return {
        type: ObjectTargetCursorType.CELESTIAL_BODY,
        name,
        minDistance: boundingRadius * 10.0,
        maxDistance: 0.0,
    };
}
