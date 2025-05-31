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

fn hash33( p : vec3i ) -> vec3f {    // this hash is not production ready, please
                         // replace this by something better
    var n = vec3i( p.x*127 + p.y*311 + p.z*74,
                   p.x*269 + p.y*183 + p.z*246,
                   p.x*113 + p.y*271 + p.z*124);

    // 1D hash by Hugo Elias
    n = (n << vec3u(13)) ^ n;
    n = n * (n * n * 15731 + 789221) + 1376312589;
    return -1.0+2.0*vec3f( vec3u(n & vec3i(0x0fffffff)))/f32(0x0fffffff);
}


// return value noise (in x) and its derivatives (in yzw)
fn gradient_noise_3d( x : vec3f ) -> vec4f
{
    // grid
    let i = vec3i(floor(x));

    let f = fract(x);
    
    // quintic interpolant
    let u = f*f*f*(f*(f*6.0-15.0)+10.0);
    let du = 30.0*f*f*(f*(f-2.0)+1.0);
    
    
    // gradients
    let ga = hash33( i+vec3i(0,0,0) );
    let gb = hash33( i+vec3i(1,0,0) );
    let gc = hash33( i+vec3i(0,1,0) );
    let gd = hash33( i+vec3i(1,1,0) );
    let ge = hash33( i+vec3i(0,0,1) );
    let gf = hash33( i+vec3i(1,0,1) );
    let gg = hash33( i+vec3i(0,1,1) );
    let gh = hash33( i+vec3i(1,1,1) );
    
    // projections
    let va = dot( ga, f-vec3f(0.0,0.0,0.0) );
    let vb = dot( gb, f-vec3f(1.0,0.0,0.0) );
    let vc = dot( gc, f-vec3f(0.0,1.0,0.0) );
    let vd = dot( gd, f-vec3f(1.0,1.0,0.0) );
    let ve = dot( ge, f-vec3f(0.0,0.0,1.0) );
    let vf = dot( gf, f-vec3f(1.0,0.0,1.0) );
    let vg = dot( gg, f-vec3f(0.0,1.0,1.0) );
    let vh = dot( gh, f-vec3f(1.0,1.0,1.0) );
	
    // interpolations
    let k0 = va-vb-vc+vd;
    let g0 = ga-gb-gc+gd;
    let k1 = va-vc-ve+vg;
    let g1 = ga-gc-ge+gg;
    let k2 = va-vb-ve+vf;
    let g2 = ga-gb-ge+gf;
    let k3 = -va+vb+vc-vd+ve-vf-vg+vh;
    let g3 = -ga+gb+gc-gd+ge-gf-gg+gh;
    let k4 = vb-va;
    let g4 = gb-ga;
    let k5 = vc-va;
    let g5 = gc-ga;
    let k6 = ve-va;
    let g6 = ge-ga;
    
    return vec4f( va + k4*u.x + k5*u.y + k6*u.z + k0*u.x*u.y + k1*u.y*u.z + k2*u.z*u.x + k3*u.x*u.y*u.z,    // value
                 ga + g4*u.x + g5*u.y + g6*u.z + g0*u.x*u.y + g1*u.y*u.z + g2*u.z*u.x + g3*u.x*u.y*u.z +   // derivatives
                 du * (vec3f(k4,k5,k6) + 
                       vec3f(k0,k1,k2)*u.yzx +
                       vec3f(k2,k0,k1)*u.zxy +
                       k3*u.yzx*u.zxy ));
}

