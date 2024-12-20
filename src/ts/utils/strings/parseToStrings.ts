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

import { Settings } from "../../settings";
import i18n from "../../i18n";

export function parseSpeed(speed: number): string {
    if (speed < 1000) {
        return `${speed.toFixed(0)} m/s`;
    } else if (speed < 1000000) {
        return `${(speed / 1000).toFixed(2)} km/s`;
    } else if (speed < 20000000) {
        return `${(speed / 1000000).toFixed(2)} Mm/s`;
    } else {
        return `${(speed / Settings.C).toFixed(2)} c`;
    }
}

export function parseDistance(distance: number): string {
    if (distance < 1000) {
        return `${distance.toFixed(0)} m`;
    } else if (distance < 1000000) {
        return `${(distance / 1000).toFixed(2)} km`;
    } else if (distance < 20000000) {
        return `${(distance / 1000000).toFixed(2)} Mm`;
    } else if (distance < 0.1 * Settings.LIGHT_YEAR) {
        return `${(distance / Settings.C).toFixed(2)} ${i18n.t("units:ls")}`;
    } else {
        return `${(distance / Settings.LIGHT_YEAR).toFixed(2)} ${i18n.t("units:ly")}`;
    }
}

export function parseSeconds(seconds: number): string {
    if (seconds < 60) {
        return `${seconds.toFixed(0)} s`;
    } else if (seconds < 3600) {
        return `${(seconds / 60).toFixed(0)} min`;
    } else if (seconds < 86400) {
        return `${(seconds / 3600).toFixed(0)} h`;
    } else if (seconds < 604800) {
        return `${(seconds / (60 * 60 * 24)).toFixed(0)} d`;
    } else if (seconds < 31557600 * 10) {
        return `${(seconds / (60 * 60 * 24 * 365.25)).toFixed(0)} y`;
    } else {
        return `∞`;
    }
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
