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
                minSize: target.isDarkKnight ? 2 : 5,
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

export function getTargetCursorDistanceRange(target: Target): { readonly min: number; readonly max: number } {
    const radius = target.getBoundingRadius();
    switch (target.type) {
        case TargetType.CUSTOM:
            return { min: 0, max: 0 };
        case TargetType.STAR_SYSTEM:
            return { min: lightYearsToMeters(2), max: lightYearsToMeters(0.2) };
        case TargetType.SPACESHIP:
            return { min: radius * 15, max: 0 };
        case TargetType.VEHICLE:
            return { min: radius * 10, max: 0 };
        case TargetType.SPACE_STATION:
        case TargetType.SPACE_ELEVATOR:
            return { min: radius * 6, max: 0 };
        case TargetType.SPACE_ELEVATOR_CLIMBER:
            return { min: radius * 7, max: radius * 3000 };
        case TargetType.LANDING_BAY:
            return { min: 8000, max: 30000 };
        case TargetType.LANDING_PAD:
            return { min: radius * 4, max: radius * 6 };
        case TargetType.ANOMALY:
            return target.isDarkKnight ? { min: radius * 5, max: radius * 100 } : { min: radius * 10, max: 0 };
        case TargetType.TELLURIC_SATELLITE:
            return { min: radius * 10, max: target.orbitSemiMajorAxis * 8 };
        case TargetType.STAR:
        case TargetType.NEUTRON_STAR:
        case TargetType.BLACK_HOLE:
        case TargetType.GAS_PLANET:
        case TargetType.TELLURIC_PLANET:
            return { min: radius * 10, max: 0 };
        default:
            return assertUnreachable(target);
    }
}
