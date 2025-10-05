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

uniform float atmosphere_radius;

uniform float atmosphere_rayleighHeight; // height falloff of rayleigh scattering (in meters)
uniform vec3 atmosphere_rayleighCoeffs; // rayleigh scattering coefficients

uniform float atmosphere_mieHeight; // height falloff of mie scattering (in meters)
uniform vec3 atmosphere_mieCoeffs; // mie scattering coefficients
uniform float atmosphere_mieAsymmetry; // mie scattering asymmetry (between -1 and 1)

uniform float atmosphere_ozoneHeight; // height of ozone layer in meters above the surface
uniform vec3 atmosphere_ozoneCoeffs; // ozone absorption coefficients
uniform float atmosphere_ozoneFalloff; // ozone falloff around the ozone layer in meters

uniform float atmosphere_sunIntensity; // controls atmosphere overall brightness