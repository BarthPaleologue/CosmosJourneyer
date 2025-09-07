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

struct Atmosphere {
    min_radius: f32, // ground radius (Rg)
    max_radius: f32, // top-of-atmosphere radius (Rt)

    rayleigh_coefficients: vec3<f32>, // σ_R (RGB)
    rayleigh_scale_height: f32, // HR

    mie_coefficients: vec3<f32>, // σ_M (RGB)
    mie_scale_height: f32, // HM

    ozone_coefficients: vec3<f32>, // σ_O (RGB)
    ozone_height: f32, // center of ozone layer
    ozone_falloff: f32,
};

@group(0) @binding(0) var transmittanceLUT: texture_storage_2d<rgba16float, write>;

@group(0) @binding(1) var<uniform> atmosphere: Atmosphere;

// --------- helpers ----------
fn ray_sphere(p0: vec3<f32>, rd: vec3<f32>, center: vec3<f32>, radius: f32) -> vec2<f32> {
    // returns (tNear, tFar); if no hit, tNear > tFar
    let oc = p0 - center;
    let b  = dot(oc, rd);
    let c  = dot(oc, oc) - radius * radius;
    let h  = b*b - c;
    if (h < 0.0) { return vec2<f32>(1.0, -1.0); }
    let s = sqrt(h);
    return vec2<f32>(-b - s, -b + s);
}

fn density_at_point(pos: vec3<f32>) -> vec3<f32> {
    let h = max(0.0, length(pos) - atmosphere.min_radius);
    var d  = vec3<f32>(0.0);
    d.x = exp(-h / atmosphere.rayleigh_scale_height);
    d.y = exp(-h / atmosphere.mie_scale_height);
    let denom = (atmosphere.ozone_height - h) / atmosphere.ozone_falloff;
    d.z = (1.0 / (denom*denom + 1.0)) * d.x;     // ozone profile scaled by Rayleigh density
    return d;
}

// Parametrization (Hillaire-like):
// y -> altitude with more precision near ground: r = sqrt(Rg^2 + y*(Rt^2 - Rg^2))
// x -> cos_theta \in [cos_theta_min(r), 1], with cos_theta_min being the horizon limit to avoid invalid rays.
fn decode_r_cos_theta(uv: vec2<f32>) -> vec2<f32> {
    let Rg = atmosphere.min_radius;
    let Rt = atmosphere.max_radius;

    // altitude mapping
    let r2 = mix(Rg*Rg, Rt*Rt, clamp(uv.y, 0.0, 1.0));
    let r  = sqrt(r2);

    // horizon-aware cos_theta range
    // cos_theta_min(r) = -sqrt(1 - (Rg/r)^2), keeps directions physically valid
    let x     = clamp(uv.x, 0.0, 1.0);
    let k     = clamp(Rg / max(r, Rg + 1e-5), 0.0, 1.0);
    let cos_thetaMin = -sqrt(max(0.0, 1.0 - k*k));
    let cos_theta    = mix(cos_thetaMin, 1.0, x);

    return vec2<f32>(r, cos_theta);
}

// Integrate optical depth along ray until hitting ground or exiting TOA
fn transmittance_from(r: f32, cos_theta: f32) -> vec3<f32> {
    let Rg = atmosphere.min_radius;
    let Rt = atmosphere.max_radius;

    // Build a starting point at latitude 0 for isotropy (azimuth irrelevant for clear air)
    let start = vec3<f32>(0.0, r, 0.0);
    // Direction with cos to local up = cos_theta
    let sinTheta = sqrt(max(0.0, 1.0 - cos_theta*cos_theta));
    let rd       = normalize(vec3<f32>(sinTheta, cos_theta, 0.0));

    // Intersections
    let hitAtm   = ray_sphere(start, rd, vec3<f32>(0.0), Rt);
    let hitGnd   = ray_sphere(start, rd, vec3<f32>(0.0), Rg);

    // We start inside atmosphere, so tExit is hitAtm.y (positive).
    var tEnd = max(0.0, hitAtm.y);
    // If we hit ground going downward, clamp to ground
    if (hitGnd.x < hitGnd.y && hitGnd.x > 0.0) {
        tEnd = min(tEnd, hitGnd.x);
    }

    if (tEnd <= 0.0) {
        return vec3<f32>(1.0, 1.0, 1.0);
    }

    // March
    let N   = 64u;
    let ds  = tEnd / f32(N);
    var t   = 0.5 * ds;

    var OD_R = 0.0;
    var OD_M = 0.0;
    var OD_O = 0.0;

    for (var i: u32 = 0u; i < N; i = i + 1u) {
        let pos = start + rd * t;
        let d   = density_at_point(pos);
        OD_R += d.x * ds;
        OD_M += d.y * ds;
        OD_O += d.z * ds;
        t += ds;
    }

    let tau = atmosphere.rayleigh_coefficients * vec3<f32>(OD_R)
            + atmosphere.mie_coefficients * vec3<f32>(OD_M)
            + atmosphere.ozone_coefficients * vec3<f32>(OD_O);

    return exp(-tau);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    let dims  : vec2<u32> = textureDimensions(output_texture);
    if (gid.x >= dims.x || gid.y >= dims.y) {
        return; 
    }

    let uv = (vec2<f32>(vec2<u32>(gid.xy)) + vec2<f32>(0.5, 0.5))
            / vec2<f32>(f32(dims.x), f32(dims.y));

    let rm = decode_r_cos_theta(uv);
    let T  = transmittance_from(rm.x, rm.y);

    textureStore(transmittanceLUT, vec2<i32>(i32(gid.x), i32(gid.y)),
                vec4<f32>(T, 1.0));
}
