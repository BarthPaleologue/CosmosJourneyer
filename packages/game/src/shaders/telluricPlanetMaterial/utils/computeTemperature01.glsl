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

float computeTemperature01(float elevation01, float absLatitude01, float ndl, float dayDuration) {
    // TODO: do not hardcode both
    float temperatureHeightFalloff = 1.2;
    float temperatureLatitudeFalloff = 1.0;

    // TODO: do not hardcode that factor
    float temperatureRotationFactor = smoothstep(0.0, 1.0, 0.15 * dayDuration);

    // https://www.desmos.com/calculator/apezlfvwic
    float temperature01 = 1.0;

    // temperature drops with latitude
    // https://www.researchgate.net/profile/Anders-Levermann/publication/274494740/figure/fig3/AS:391827732615174@1470430419170/a-Surface-air-temperature-as-a-function-of-latitude-for-data-averaged-over-1961-90-for.png
    temperature01 -= pow(temperatureLatitudeFalloff * absLatitude01, 3.0);

    // temperature drops exponentially with elevation
    temperature01 *= exp(-elevation01 * temperatureHeightFalloff);
    
    // temperature drops during nighttime (more ice)
    temperature01 *= ndl * temperatureRotationFactor + 1.0 - temperatureRotationFactor;

    // cannot exceed max and min temperatures
    temperature01 = clamp(temperature01, 0.0, 1.0);

    return temperature01;
}