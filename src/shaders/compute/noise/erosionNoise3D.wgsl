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

const erosionscale: f32 = 4.0;

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
fn mountain(p: vec3<f32>, nor: vec3<f32>, erosion_amount: f32) -> f32 {

    var n: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var nf: f32 = 1.0;
    var na: f32 = 0.6;
    for (var i: i32 = 0; i < 3; i++) {
       n += gradient_noise_3d(p*nf)*na*vec4<f32>(1.0, nf, nf, nf);
       na *= 0.5;
       nf *= 2.0;
    }

    let noise_before_erosion_01 = smoothstep(-1.0, 1.0, n.x);

    if(erosion_amount <= 0.0) {
        return noise_before_erosion_01;
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
    for (var i: i32 = 0; i < 4; i++) {
        h += erosion(p*erosionscale*f, dir+cross(h.yzw, normalize(p)))*a*vec4<f32>(1.0, f, f, f);
        a *= 0.6;
        f *= 2.0;
    }
    //remap height to [0,1] and add erosion
    //looks best when erosion amount is small
    //not sure about adding the normals together, but it looks okay
    return noise_before_erosion_01 + h.x * 0.01 * erosion_amount;
}