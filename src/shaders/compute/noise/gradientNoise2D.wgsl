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