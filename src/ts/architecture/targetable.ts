import { Transformable } from "./transformable";
import { HasBoundingSphere } from "./hasBoundingSphere";
import { TypedObject } from "./typedObject";

export const enum ObjectTargetCursorType {
    CELESTIAL_BODY,
    FACILITY,
    ANOMALY,
    LANDING_PAD,
    STAR_SYSTEM
}

export type TargetInfo = {
    type: ObjectTargetCursorType;
    minDistance: number;
    maxDistance: number;
};

export interface Targetable extends Transformable, HasBoundingSphere, TypedObject {
    readonly targetInfo: TargetInfo;
}

export function defaultTargetInfoCelestialBody(boundingRadius: number): TargetInfo {
    return {
        type: ObjectTargetCursorType.CELESTIAL_BODY,
        minDistance: boundingRadius * 10.0,
        maxDistance: 0.0
    };
}