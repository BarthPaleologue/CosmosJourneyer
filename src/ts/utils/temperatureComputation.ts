/**
 * Computes the mean temperature of a planet given the properties of its star and itself
 * @param starTemperature The temperature of the star
 * @param starRadius The radius of the star
 * @param starDistance The distance between the planet and the star
 * @param planetAlbedo The albedo of the planet
 * @param planetGreenHouseEffect The greenhouse effect of the planet
 */
export function computeMeanTemperature(starTemperature: number, starRadius: number, starDistance: number, planetAlbedo: number, planetGreenHouseEffect: number) {
    return starTemperature * Math.pow(((1 - planetAlbedo) * starRadius ** 2) / (4 * (1 - planetGreenHouseEffect) * starDistance ** 2), 0.25);
}
