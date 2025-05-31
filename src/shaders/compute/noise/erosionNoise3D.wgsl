//3D MODIFICATION OF "ERODED TERRAIN NOISE" By clayjohn : https://www.shadertoy.com/view/MtGcWh
//I Would recommend starting there for an understanding of the code, the changes were minor, but
//I felt like making this available.

//ORIGINAL COPYRIGHT DISCLAIMER

//Copyright 2020 Clay John

//Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
//and associated documentation files (the "Software"), to deal in the Software without restriction, 
//including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, 
//and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do 
//so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in all copies or 
//substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
//NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
//IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
//WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
//SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


//GRADIENT 3D NOISE DERIVATIVES SCENE/PREVIEW BY IQ : https://www.shadertoy.com/view/4dffRH

const erosionscale: f32 = 1.0;

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


// From https://www.shadertoy.com/view/4dffRH
// Name : iq
// License : MIT
// Modified to remove the different settings, and use sineless hash.
// return value noise (in x) and its derivatives (in yzw)
fn gradient_noise_3d(x: vec3<f32>) -> vec4<f32> {
    let i = floor(x);
    let f = fract(x);
    
    // cubic interpolant
    let u = f*f*(3.0-2.0*f);
    let du = 6.0*f*(1.0-f);    
    
    // gradients
    let ga = hash33(i+vec3<f32>(0.0,0.0,0.0));
    let gb = hash33(i+vec3<f32>(1.0,0.0,0.0));
    let gc = hash33(i+vec3<f32>(0.0,1.0,0.0));
    let gd = hash33(i+vec3<f32>(1.0,1.0,0.0));
    let ge = hash33(i+vec3<f32>(0.0,0.0,1.0));
    let gf = hash33(i+vec3<f32>(1.0,0.0,1.0));
    let gg = hash33(i+vec3<f32>(0.0,1.0,1.0));
    let gh = hash33(i+vec3<f32>(1.0,1.0,1.0));

    // projections
    let va = dot(ga, f-vec3<f32>(0.0,0.0,0.0));
    let vb = dot(gb, f-vec3<f32>(1.0,0.0,0.0));
    let vc = dot(gc, f-vec3<f32>(0.0,1.0,0.0));
    let vd = dot(gd, f-vec3<f32>(1.0,1.0,0.0));
    let ve = dot(ge, f-vec3<f32>(0.0,0.0,1.0));
    let vf = dot(gf, f-vec3<f32>(1.0,0.0,1.0));
    let vg = dot(gg, f-vec3<f32>(0.0,1.0,1.0));
    let vh = dot(gh, f-vec3<f32>(1.0,1.0,1.0));
	
    // interpolations
    return vec4<f32>(
        va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + (-va+vb+vc-vd+ve-vf-vg+vh)*u.x*u.y*u.z,    // value
        ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + (-ga+gb+gc-gd+ge-gf-gg+gh)*u.x*u.y*u.z +   // derivatives
        du * (vec3<f32>(vb,vc,ve) - va + u.yzx*vec3<f32>(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3<f32>(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh))
    );
}



// code modified from https://www.shadertoy.com/view/4tB3RR
// Name : Gavoronoise 3d
// Author : guil
// License : // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
fn erosion(p: vec3<f32>, dir: vec3<f32>) -> vec4<f32> {    
    let ip = floor(p);
    let fp = fract(p);
    let f = 4.0*3.14159265359;//frequency (PI constant)
    var va: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var wt: f32 = 0.0;
    
    for (var i: i32 = -2; i <= 1; i++) { 
        for (var j: i32 = -2; j <= 1; j++) {
            for (var k: i32 = -2; k <= 1; k++) {		
                let o = vec3<f32>(f32(i), f32(j), f32(k));
                let h = hash33((ip - o))*.5;
                let pp = fp + o - h;
                let d = dot(pp, pp);
                let w = exp(-d*8.0);
                wt += w;
                let mag = dot(pp, dir);
                va += vec4<f32>(cos(mag*f), -sin(mag*f)*(pp+dir))*w;
            }
        }
    }
    
    return va/wt;
}


//Modified to have erosionscale and it to be 3D
fn mountain(p: vec3<f32>, nor: vec3<f32>) -> f32 {

    var n: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var nf: f32 = 1.0;
    var na: f32 = 0.6;
    for (var i: i32 = 0; i < 2; i++) {
       n += gradient_noise_3d(p*nf)*na*vec4<f32>(1.0, nf, nf, nf);
       na *= 0.5;
       nf *= 2.0;
    }
    
    //take the curl of the normal to get the gradient facing down the slope
    let dir = cross(n.yzw, nor);
    
    //Now we compute another fbm type noise
    // erosion is a type of noise with a strong directionality
    //we pass in the direction based on the slope of the terrain
    //erosion also returns the slope. we add that to a running total
    //so that the direction of successive layers are based on the
    //past layers
    var h: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var a: f32 = 0.7*(smoothstep(0.3, 0.5, n.x*0.5+0.5)); //smooth the valleys
    var f: f32 = 1.0;
    for (var i: i32 = 0; i < 5; i++) {
        h += erosion(p*erosionscale*f, dir+cross(h.yzw, normalize(p)))*a*vec4<f32>(1.0, f, f, f);
        a *= 0.6;
        f *= 2.0;
    }
    //remap height to [0,1] and add erosion
    //looks best when erosion amount is small
    //not sure about adding the normals together, but it looks okay
    return (smoothstep(-1.0, 1.0, n.x)+h.x*0.01);
}