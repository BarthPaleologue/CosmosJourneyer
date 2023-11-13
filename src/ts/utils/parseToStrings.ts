import { Settings } from "../settings";

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
    } else {
        return `${(distance / Settings.C).toFixed(2)} ls`;
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

export const alphabet = "abcdefghijklmnopqrstuvwxyz";
export function starName(baseName: string, index: number): string {
    return `${baseName} ${alphabet[index].toUpperCase()}`;
}
