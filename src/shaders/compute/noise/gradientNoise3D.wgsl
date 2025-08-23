// The MIT License
// Copyright © 2017 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/

// Computes the analytic derivatives of a 3D Gradient Noise. This can be used for example to compute normals to a
// 3d rocks based on Gradient Noise without approximating the gradient by having to take central differences.
//
// More info here: https://iquilezles.org/articles/gradientnoise

// All noise functions here:
//
// https://www.shadertoy.com/playlist/fXlXzf&from=0&num=12

// From https://www.shadertoy.com/view/4djSRW
// Name : Hash without Sine
// Author : Dave_Hoskins
// License : MIT
// Why not normal hash? Because terrible for planets, and that is what I am using this for.
fn hash33(p3: vec3<f32>) -> vec3<f32> {
	var p3_mod = fract(p3 * vec3<f32>(.1031, .1030, .0973));
    p3_mod += dot(p3_mod, p3_mod.yxz+33.33);
    return 1.0 - 2.0 * fract((p3_mod.xxy + p3_mod.yxx)*p3_mod.zyx);

}

// return value noise (in x) and its derivatives (in yzw)
fn gradient_noise_3d(x : vec3<f32>) -> vec4<f32> {
    // grid
    let i = floor(x);
    let f = fract(x);
    
    // quintic interpolant
    let u = f*f*f*(f*(f*6.0-15.0)+10.0);
    let du = 30.0*f*f*(f*(f-2.0)+1.0);
    
    // gradients
    let ga = hash33(i + vec3<f32>(0.0, 0.0, 0.0));
    let gb = hash33(i + vec3<f32>(1.0, 0.0, 0.0));
    let gc = hash33(i + vec3<f32>(0.0, 1.0, 0.0));
    let gd = hash33(i + vec3<f32>(1.0, 1.0, 0.0));
    let ge = hash33(i + vec3<f32>(0.0, 0.0, 1.0));
    let gf = hash33(i + vec3<f32>(1.0, 0.0, 1.0));
    let gg = hash33(i + vec3<f32>(0.0, 1.0, 1.0));
    let gh = hash33(i + vec3<f32>(1.0, 1.0, 1.0));
    
    // projections
    let va = dot(ga, f - vec3<f32>(0.0, 0.0, 0.0));
    let vb = dot(gb, f - vec3<f32>(1.0, 0.0, 0.0));
    let vc = dot(gc, f - vec3<f32>(0.0, 1.0, 0.0));
    let vd = dot(gd, f - vec3<f32>(1.0, 1.0, 0.0));
    let ve = dot(ge, f - vec3<f32>(0.0, 0.0, 1.0));
    let vf = dot(gf, f - vec3<f32>(1.0, 0.0, 1.0));
    let vg = dot(gg, f - vec3<f32>(0.0, 1.0, 1.0));
    let vh = dot(gh, f - vec3<f32>(1.0, 1.0, 1.0));
	
    // interpolations
    let k0 = va - vb - vc + vd;
    let g0 = ga - gb - gc + gd;
    let k1 = va - vc - ve + vg;
    let g1 = ga - gc - ge + gg;
    let k2 = va - vb - ve + vf;
    let g2 = ga - gb - ge + gf;
    let k3 = -va + vb + vc - vd + ve - vf - vg + vh;
    let g3 = -ga + gb + gc - gd + ge - gf - gg + gh;
    let k4 = vb - va;
    let g4 = gb - ga;
    let k5 = vc - va;
    let g5 = gc - ga;
    let k6 = ve - va;
    let g6 = ge - ga;
    
    return vec4f( va + k4*u.x + k5*u.y + k6*u.z + k0*u.x*u.y + k1*u.y*u.z + k2*u.z*u.x + k3*u.x*u.y*u.z,    // value
                 ga + g4*u.x + g5*u.y + g6*u.z + g0*u.x*u.y + g1*u.y*u.z + g2*u.z*u.x + g3*u.x*u.y*u.z +   // derivatives
                 du * (vec3f(k4,k5,k6) + 
                       vec3f(k0,k1,k2)*u.yzx +
                       vec3f(k2,k0,k1)*u.zxy +
                       k3*u.yzx*u.zxy ));
}

fn gradient_noise_3d_fbm(p: vec3<f32>, octave_count: u32) -> f32 {
    var sample_position = p;
    var octave_amplitude = 1.0;
    var total_amplitude = 0.0;
    var result = 0.0;
    for(var i = 0u; i < octave_count; i+=1u) {
        result += gradient_noise_3d(sample_position).x * octave_amplitude;
        total_amplitude += octave_amplitude;

        sample_position *= 2.0;
        octave_amplitude /= 2.0;
    }

    return result / total_amplitude;
}

// Approx inverse-CDF for single-octave gradient/Perlin-like noise remapped to [0,1].
// Input:  p = desired coverage (e.g. 0.70 means 70% water)
// Return: threshold t so that ~p of samples fall <= t for this noise.
fn invert_noise_threshold(p: f32) -> f32 {
    let k: f32 = 4.50;                 // sharpness 1.5..1.7 works well for 3D gradient noise
    let x: f32 = clamp(p, 1e-6, 1.0-1e-6);
    let l: f32 = log(x/(1.0 - x));     // logit
    return 1.0 / (1.0 + exp(-l / k));  // logistic(logit(p)/k)
}