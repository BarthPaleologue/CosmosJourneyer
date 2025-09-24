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

import i18n from "@/i18n";

import { C } from "../physics/constants";
import { lightYearsToMeters, metersToLightSeconds, metersToLightYears } from "../physics/unitConversions";

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
 * @param distance Distance in meters.
 * @returns A string representing the distance in a human-readable format.
 */
export function parseDistance(distance: number): string {
    if (distance < 1_000) {
        return i18n.t("units:shortM", { value: distance.toFixed(0) });
    } else if (distance < 1_000_000) {
        return i18n.t("units:shortKm", { value: (distance / 1_000).toFixed(2) });
    } else if (distance < 300_000_000) {
        return i18n.t("units:shortMm", { value: (distance / 1_000_000).toFixed(2) });
    } else if (distance < lightYearsToMeters(0.1)) {
        return i18n.t("units:shortLs", { value: metersToLightSeconds(distance).toFixed(2) });
    } else {
        return i18n.t("units:shortLy", {
            value: metersToLightYears(distance).toFixed(2),
        });
    }
}

export function parseSecondsRough(seconds: number): string {
    if (seconds < 60) {
        return i18n.t("units:shortSeconds", { count: Number(seconds.toFixed(0)) });
    } else if (seconds < 60 * 60) {
        return i18n.t("units:shortMinutes", { count: Number((seconds / 60).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24) {
        return i18n.t("units:shortHours", { count: Number((seconds / 3600).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24 * 365.25) {
        return i18n.t("units:shortDays", { count: Number((seconds / (60 * 60 * 24)).toFixed(0)) });
    } else if (seconds < 60 * 60 * 24 * 365.25 * 10) {
        return i18n.t("units:shortYears", {
            count: Number((seconds / (60 * 60 * 24 * 365.25)).toFixed(0)),
        });
    } else {
        return `∞`;
    }
}

export function parseSecondsPrecise(seconds: number): string {
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
    if (nbYears > 0) result.push(i18n.t("units:years", { count: nbYears }));
    if (nbDays > 0) result.push(i18n.t("units:days", { count: nbDays }));
    if (nbHours > 0) result.push(i18n.t("units:hours", { count: nbHours }));
    if (nbMinutes > 0) result.push(i18n.t("units:minutes", { count: nbMinutes }));
    if (nbSeconds > 0) result.push(i18n.t("units:seconds", { count: nbSeconds }));

    return result.join(" ");
}

/**
 * Parse a number between 0 and 1 to a percentage string.
 * Example: 0.5 -> "50%"
 * @param percentage01 A number between 0 and 1 representing a percentage.
 * @returns A string representing the percentage.
 */
export function parsePercentageFrom01(percentage01: number): string {
    return `${(percentage01 * 100).toFixed(0)}%`;
}

export const Alphabet = "abcdefghijklmnopqrstuvwxyz";

export const GreekAlphabet = "αβγδεζηθικλμνξοπρστυφχψω";
export const ReversedGreekAlphabet = GreekAlphabet.split("").reverse().join("");
