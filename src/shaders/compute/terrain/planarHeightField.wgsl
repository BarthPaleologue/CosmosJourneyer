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

struct Params {
    nbVerticesPerRow : u32,
    size : f32,
    octaves : i32,
    lacunarity : f32,
    persistence : f32,
    scaleFactor : f32,
};

@group(0) @binding(0) var<storage, read_write> positions : array<f32>;
@group(0) @binding(1) var<storage, read_write> normals : array<f32>;
@group(0) @binding(2) var<storage, read_write> indices : array<u32>;
@group(0) @binding(3) var<uniform> params : Params;

const PI : f32 = 3.141592653589793;

fn hash(x: vec2<f32>) -> vec2<f32> {
    let k = vec2(0.3183099, 0.3678794);
    let newX = x*k + k.yx;
    return -1.0 + 2.0*fract(16.0 * k*fract(newX.x*newX.y*(newX.x+newX.y)));
}

// from https://www.shadertoy.com/view/XdXBRH
//name:Noise - Gradient - 2D - Deriv
//Author: iq
//License: MIT
// return gradient noise (in x) and its derivatives (in yz)
fn noised(p: vec2<f32>) -> vec3<f32> {
    let i = floor(p);
    let f = fract(p);

    let u = f*f*f*(f*(f * 6.0 - 15.0) + 10.0);
    let du = 30.0*f*f*(f*(f - 2.0) + 1.0);

    let ga = hash(i + vec2(0.0, 0.0));
    let gb = hash(i + vec2(1.0, 0.0));
    let gc = hash(i + vec2(0.0, 1.0));
    let gd = hash(i + vec2(1.0, 1.0));

    let va = dot(ga, f - vec2(0.0, 0.0));
    let vb = dot(gb, f - vec2(1.0, 0.0));
    let vc = dot(gc, f - vec2(0.0, 1.0));
    let vd = dot(gd, f - vec2(1.0, 1.0));

    return vec3(va + u.x*(vb-va) + u.y*(vc-va) + u.x*u.y*(va-vb-vc+vd), // value
    ga + u.x*(gb-ga) + u.y*(gc-ga) + u.x*u.y*(ga-gb-gc+gd) +// derivatives
    du * (u.yx*(va-vb-vc+vd) + vec2(vb, vc) - va));
}

// Function to compute the curl of a 2D vector field
fn curl2D(noiseGradient: vec2<f32>) -> vec2<f32> {
    return vec2(noiseGradient.y, -noiseGradient.x);
}

// code adapted from https://www.shadertoy.com/view/llsGWl
// name: Gavoronoise
// author: guil
// license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
//Code has been modified to return analytic derivatives and to favour
//direction quite a bit.
fn erosion(p: vec2<f32>, dir: vec2<f32>) -> vec3<f32> {
    let ip = floor(p);
    let fp = fract(p);
    let f = 2.*PI;
    var va = vec3(0.0);
    var wt = 0.0;
    for (var i: i32 =-2; i<2; i=i+1) {
        for (var j: i32=-2; j<2; j=j+1) {
            let o = vec2<f32>(f32(i), f32(j));
            let h = hash(ip - o)*0.5;
            let pp = fp +o - h;
            let d = dot(pp, pp);
            let w = exp(-d*2.0);
            wt +=w;
            let mag = dot(pp, dir);
            va += vec3(cos(mag*f), -sin(mag*f)*(pp+dir))*w;
        }
    }
    return va/wt;
}


//This is where the magic happens
fn mountain(p: vec2<f32>, baseNoise: vec3<f32>) -> vec3<f32> {
    //First generate a base heightmap
    //it can be based on any type of noise
    //so long as you also generate normals
    //Im just doing basic FBM based terrain using
    //iq's analytic derivative gradient noise
    let n = baseNoise;

    //take the curl of the normal to get the gradient facing down the slope
    let dir = curl2D(n.yz);

    //Now we compute another fbm type noise
    // erosion is a type of noise with a strong directionality
    //we pass in the direction based on the slope of the terrain
    //erosion also returns the slope. we add that to a running total
    //so that the direction of successive layers are based on the
    //past layers
    var h = vec3(0.0);
    var a = 0.7*(smoothstep(0.3, 0.5, n.x*0.5+0.5));//smooth the valleys
    var f = 1.0;
    for (var i: i32 =0;i<5;i=i+1) {
        h+= erosion(p*f, dir+curl2D(h.yz))*a*vec3(1.0, f, f);
        a*=0.4;
        f*=2.0;
    }
    //remap height to [0,1] and add erosion
    //looks best when erosion amount is small
    //not sure about adding the normals together, but it looks okay
    return vec3(smoothstep(-1.0, 1.0, n.x)+h.x*0.05, (n.yz+h.yz));
}

@compute @workgroup_size(1,1,1)
fn main(@builtin(global_invocation_id) id: vec3<u32>)
{
    let x : f32 = f32(id.x);
    let y : f32 = f32(id.y);

    let index: u32 = id.x + id.y * u32(params.nbVerticesPerRow);

    var vertex_position = vec3<f32>(params.size * x / f32(params.nbVerticesPerRow - 1) - params.size / 2.0, 0.0, params.size * y / f32(params.nbVerticesPerRow - 1) - params.size / 2.0);

    var scale : f32 = params.scaleFactor;
    var weight : f32 = 1.0;
    let mapResolution : vec2<f32> = vec2<f32>(f32(params.nbVerticesPerRow), f32(params.nbVerticesPerRow));
    var gradient : vec2<f32> = vec2<f32>(0.0, 0.0);
    var elevation : f32 = 0.0;
    for (var i : i32 = 0; i < params.octaves; i = i + 1) {
        let samplePoint = vertex_position.xz * scale;

        let val = noised(samplePoint) * weight;
        var local_gradient = vec2<f32>(val.y, val.z);
        local_gradient *= scale;

        gradient += local_gradient;
        elevation += val.x;

        scale = scale * params.lacunarity;
        weight = weight * params.persistence;
    }

    let erosionBase = vec3(elevation, gradient.x, gradient.y);
    let result = mountain(vec2<f32>(x,y)/mapResolution * 10.0, erosionBase);

    positions[index * 3 + 0] = vertex_position.x;
    positions[index * 3 + 1] = result.x;
    positions[index * 3 + 2] = vertex_position.z;

    let normal = normalize(vec3<f32>(-result.y, 1.0, -result.z));
    normals[index * 3 + 0] = normal.x;
    normals[index * 3 + 1] = normal.y;
    normals[index * 3 + 2] = normal.z;

    if(x > 0 && y > 0) {
        let indexIndex = ((id.x - 1) + (id.y - 1) * (params.nbVerticesPerRow - 1)) * 6;

        indices[indexIndex + 0] = index - 1;
        indices[indexIndex + 1] = index - params.nbVerticesPerRow - 1;
        indices[indexIndex + 2] = index;

        indices[indexIndex + 3] = index;
        indices[indexIndex + 4] = index - params.nbVerticesPerRow - 1;
        indices[indexIndex + 5] = index - params.nbVerticesPerRow;
    }
}