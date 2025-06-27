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