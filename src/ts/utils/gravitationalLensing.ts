import { Settings } from "../settings";

/**
 * Returns the minimal distance from an object at which the gravitational lensing effect becomes visible and eventually usable for magnification.
 * @param mass The mass of the object in kg
 * @param radius The radius of the object in meters
 * @returns The computed distance in meters
 * @see https://astronomy.stackexchange.com/questions/33498/what-is-the-gravitational-lensing-focal-distance-of-a-white-dwarf-star
 */
export function getGravitationalLensFocalDistance(mass: number, radius: number) {
    return (Settings.C * radius) ** 2 / (4 * Settings.G * mass);
}
