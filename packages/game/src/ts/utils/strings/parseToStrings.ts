//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import {
    C,
    lightYearsToMeters,
    metersToLightMinutes,
    metersToLightSeconds,
    metersToLightYears,
} from "@cosmos-journeyer/physics";
import type { TFunction } from "i18next";

/**
 * Formats a speed in metres per second using a scale suited to its magnitude.
 * @param speed - Speed in metres per second.
 * @returns Rounded speed with units of m/s, km/s, Mm/s, or a fraction of light speed.
 */
export function parseSpeed(speed: number): string {
    if (speed < 1_000) {
        return `${speed.toFixed(0)} m/s`;
    } else if (speed < 1_000_000) {
        return `${(speed / 1_000).toFixed(2)} km/s`;
    } else if (speed < 20_000_000) {
        return `${(speed / 1_000_000).toFixed(2)} Mm/s`;
    } else {
        return `${(speed / C).toFixed(2)} c`;
    }
}

/**
 * Formats a distance using the most readable supported astronomical unit.
 * @param distance - Distance in metres.
 * @param t - The translation function used to localize player-facing text.
 * @returns Localized distance with units from metres through light-years.
 */
export function parseDistance(distance: number, t: TFunction): string {
    if (distance < 1_000) {
        return t("units:shortM", { value: distance.toFixed(0) });
    } else if (distance < 1_000_000) {
        return t("units:shortKm", { value: (distance / 1_000).toFixed(2) });
    } else if (distance < 300_000_000) {
        return t("units:shortMm", { value: (distance / 1_000_000).toFixed(2) });
    } else if (distance < C * 120) {
        return t("units:shortLs", { value: metersToLightSeconds(distance).toFixed(2) });
    } else if (distance < lightYearsToMeters(0.1)) {
        return t("units:shortLm", { value: metersToLightMinutes(distance).toFixed(2) });
    } else {
        return t("units:shortLy", {
            value: metersToLightYears(distance).toFixed(2),
        });
    }
}

/**
 * Formats a duration as one rounded, localized unit.
 * @param seconds - Duration in seconds.
 * @param t - The translation function used to localize player-facing text.
 * @returns Rounded seconds, minutes, hours, days, or years; durations of ten years or more display as infinity.
 */
export function parseSecondsRough(seconds: number, t: TFunction): string {
    if (seconds < 60) {
        return t("units:shortSeconds", { count: Number(seconds.toFixed(0)) });
    } else if (seconds < 60 * 60) {
        return t("units:shortMinutes", { count: Number((seconds / 60).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24) {
        return t("units:shortHours", { count: Number((seconds / 3600).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24 * 365.25) {
        return t("units:shortDays", { count: Number((seconds / (60 * 60 * 24)).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24 * 365.25 * 10) {
        return t("units:shortYears", {
            count: Number((seconds / (60 * 60 * 24 * 365.25)).toFixed(0)),
        });
    } else {
        return `∞`;
    }
}

/**
 * Formats a duration as a sequence of non-zero calendar-sized units.
 * @param seconds - Non-negative duration in seconds.
 * @param t - The translation function used to localize player-facing text.
 * @returns Localized years, days, hours, minutes, and seconds, omitting zero-valued units.
 */
export function parseSecondsPrecise(seconds: number, t: TFunction): string {
    let secondsLeft = seconds;
    const nbYears = Math.floor(secondsLeft / (60 * 60 * 24 * 365.25));
    secondsLeft -= nbYears * 365.25 * 24 * 60 * 60;
    const nbDays = Math.floor(secondsLeft / (24 * 60 * 60));
    secondsLeft -= nbDays * 24 * 60 * 60;
    const nbHours = Math.floor(secondsLeft / (60 * 60));
    secondsLeft -= nbHours * 60 * 60;
    const nbMinutes = Math.floor(secondsLeft / 60);
    secondsLeft -= nbMinutes * 60;
    const nbSeconds = Math.floor(secondsLeft);

    const result: string[] = [];
    if (nbYears > 0) {
        result.push(t("units:years", { count: nbYears }));
    }
    if (nbDays > 0) {
        result.push(t("units:days", { count: nbDays }));
    }
    if (nbHours > 0) {
        result.push(t("units:hours", { count: nbHours }));
    }
    if (nbMinutes > 0) {
        result.push(t("units:minutes", { count: nbMinutes }));
    }
    if (nbSeconds > 0) {
        result.push(t("units:seconds", { count: nbSeconds }));
    }

    return result.join(" ");
}

/**
 * @param percentage01 - A number between 0 and 1 representing a percentage.
 * @returns A string representing the percentage.
 */
export function parsePercentageFrom01(percentage01: number): string {
    return `${(percentage01 * 100).toFixed(0)}%`;
}

export const Alphabet = "abcdefghijklmnopqrstuvwxyz";

export const GreekAlphabet = "αβγδεζηθικλμνξοπρστυφχψω";
export const ReversedGreekAlphabet = GreekAlphabet.split("").reverse().join("");
