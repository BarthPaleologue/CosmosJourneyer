//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { lightYearsToMeters } from "@cosmos-journeyer/physics";
import { assertUnreachable } from "@cosmos-journeyer/typescript";
import type { TFunction } from "i18next";

import { smoothstep } from "@/utils/math";

import { TargetType } from "../../gameplay/targeting/target";
import type { Target } from "../../gameplay/targeting/target";

export type TargetCursorAppearance = {
    readonly shape: "rotated" | "rounded";
    readonly minSize: number;
    readonly maxSize: number;
};

export function getTargetDisplayName(target: Target, t: TFunction): string {
    if (target.type === TargetType.LANDING_PAD) {
        return t("objectTypes:landingPadName", { padIdentifier: target.padIdentifier });
    }
    return target.properName ?? getTargetTypeName(target, t);
}

export function getTargetTypeName(target: Target, t: TFunction): string {
    switch (target.type) {
        case TargetType.STAR_SYSTEM:
            return t("objectTypes:starSystem");
        case TargetType.STAR:
            return t("objectTypes:star", { stellarType: target.stellarType });
        case TargetType.NEUTRON_STAR:
            return t("objectTypes:neutronStar");
        case TargetType.BLACK_HOLE:
            return t("objectTypes:blackHole");
        case TargetType.GAS_PLANET:
            return t("objectTypes:gasPlanet");
        case TargetType.TELLURIC_PLANET:
            return t("objectTypes:telluricPlanet");
        case TargetType.TELLURIC_SATELLITE:
            return t("objectTypes:telluricMoon");
        case TargetType.SPACE_STATION:
            return t("objectTypes:spaceStation");
        case TargetType.SPACE_ELEVATOR:
            return t("objectTypes:spaceElevator");
        case TargetType.CUSTOM:
            return t("objectTypes:custom");
        case TargetType.ANOMALY:
            return t("objectTypes:anomaly");
        case TargetType.SPACE_ELEVATOR_CLIMBER:
            return t("objectTypes:spaceElevatorClimber");
        case TargetType.LANDING_BAY:
            return t("objectTypes:landingBay");
        case TargetType.LANDING_PAD:
            return t("objectTypes:landingPad");
        case TargetType.SPACESHIP:
            return t("objectTypes:spaceship");
        case TargetType.VEHICLE:
            return t("objectTypes:vehicle");
        default:
            return assertUnreachable(target);
    }
}

export function getTargetCursorAppearance(target: Target): TargetCursorAppearance {
    switch (target.type) {
        case TargetType.ANOMALY:
            return {
                shape: "rounded",
                minSize: 5,
                maxSize: 0,
            };
        case TargetType.SPACE_STATION:
        case TargetType.SPACE_ELEVATOR:
            return {
                shape: "rotated",
                minSize: 3,
                maxSize: 0,
            };
        case TargetType.SPACE_ELEVATOR_CLIMBER:
            return {
                shape: "rotated",
                minSize: 3,
                maxSize: 0,
            };
        case TargetType.LANDING_BAY:
            return {
                shape: "rotated",
                minSize: 2,
                maxSize: 0,
            };
        case TargetType.LANDING_PAD:
            return {
                shape: "rotated",
                minSize: 1.5,
                maxSize: 1.5,
            };
        case TargetType.STAR_SYSTEM:
            return {
                shape: "rounded",
                minSize: 1.5,
                maxSize: 1.5,
            };
        case TargetType.SPACESHIP:
            return {
                shape: "rotated",
                minSize: 1.5,
                maxSize: 1.5,
            };
        case TargetType.VEHICLE:
            return {
                shape: "rotated",
                minSize: 1.5,
                maxSize: 1.5,
            };
        case TargetType.TELLURIC_SATELLITE:
            return {
                shape: "rounded",
                minSize: 5,
                maxSize: 0,
            };
        case TargetType.BLACK_HOLE:
        case TargetType.CUSTOM:
        case TargetType.GAS_PLANET:
        case TargetType.NEUTRON_STAR:
        case TargetType.STAR:
        case TargetType.TELLURIC_PLANET:
            return {
                shape: "rounded",
                minSize: 5,
                maxSize: 0,
            };
        default:
            return assertUnreachable(target);
    }
}

/** Presentation-only fades; sensor range is supplied by gameplay targeting. */
export function getTargetCursorOpacity(
    target: Target,
    distance: number,
    sensorRange: number | null,
    isSelected: boolean,
    hasKnownOverride: boolean,
): number {
    if (target.type === TargetType.STAR_SYSTEM && !isSelected) {
        return 0;
    }
    const localOpacity =
        target.type === TargetType.TELLURIC_SATELLITE && !isSelected && !hasKnownOverride
            ? 1 - smoothstep(target.orbitSemiMajorAxis * 6.4, target.orbitSemiMajorAxis * 8, distance)
            : 1;
    const detectionOpacity =
        sensorRange === null ? 1 : sensorRange > 0 ? 1 - smoothstep(sensorRange * 0.8, sensorRange, distance) : 0;
    return getTargetProximityOpacity(target, distance) * detectionOpacity * localOpacity;
}

function getTargetProximityOpacity(target: Target, distance: number): number {
    const radius = target.getBoundingRadius();
    let minDistance: number;
    switch (target.type) {
        case TargetType.CUSTOM:
            minDistance = 0;
            break;
        case TargetType.STAR_SYSTEM:
            minDistance = lightYearsToMeters(2);
            break;
        case TargetType.SPACESHIP:
            minDistance = radius * 15;
            break;
        case TargetType.VEHICLE:
        case TargetType.STAR:
        case TargetType.NEUTRON_STAR:
        case TargetType.BLACK_HOLE:
        case TargetType.GAS_PLANET:
        case TargetType.TELLURIC_PLANET:
        case TargetType.TELLURIC_SATELLITE:
        case TargetType.ANOMALY:
            minDistance = radius * 10;
            break;
        case TargetType.SPACE_STATION:
        case TargetType.SPACE_ELEVATOR:
            minDistance = radius * 6;
            break;
        case TargetType.SPACE_ELEVATOR_CLIMBER:
            minDistance = radius * 7;
            break;
        case TargetType.LANDING_BAY:
            minDistance = 8000;
            break;
        case TargetType.LANDING_PAD:
            minDistance = radius * 4;
            break;
        default:
            return assertUnreachable(target);
    }
    return minDistance > 0 ? smoothstep(minDistance * 0.5, minDistance, distance) : 1;
}
