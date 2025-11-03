use crate::utils::vector3::Vector3;
use std::f32::consts::PI;

// from https://www.shadertoy.com/view/4dffRH

fn hash(p: &Vector3) -> Vector3 // this hash is not production ready, please
{
    // replace this by something better
    let mut new_p = Vector3::new(
        Vector3::dot(p, &Vector3::new(127.1, 311.7, 74.7)),
        Vector3::dot(p, &Vector3::new(269.5, 183.3, 246.1)),
        Vector3::dot(p, &Vector3::new(113.5, 271.9, 124.6)),
    );

    new_p.map_in_place(f32::sin);
    new_p *= 43758.5453123;
    new_p.map_in_place(f32::fract);
    new_p *= 2.0;
    new_p -= 1.0;

    new_p
}

fn curl3d(vector: &Vector3) -> Vector3 {
    Vector3::new(
        vector.z - vector.y,
        vector.x - vector.z,
        vector.y - vector.x
    )
}

fn smoothstep(edge0: f32, edge1: f32, x: f32) -> f32 {
    let t = f32::min(f32::max((x - edge0) / (edge1 - edge0), 0.0), 1.0);
    t * t * (3.0 - 2.0 * t)
}

// code adapted from https://www.shadertoy.com/view/llsGWl
// name: Gavoronoise
// author: guil
// license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
//Code has been modified to return analytic derivatives and to favour
//direction quite a bit.
pub fn erosion(p: &Vector3, dir: &Vector3) -> (f32, Vector3) {
    let ip = p.map(f32::floor);
    let fp = p.map(f32::fract);
    let f = 2.0 * PI;
    let mut va = 0.0;
    let mut gradient = Vector3::zero();
    let mut wt = 0.0;
    for i in -2..=1 {
        for j in -2..=1 {
            for k in -2..=1 {
                let o = Vector3::new(i as f32, j as f32, k as f32);
                let h = hash(&(&ip - &o)) * 0.5;
                let pp = &fp + &o - h;
                let d = Vector3::dot(&pp, &pp);
                let w = f32::exp(-d * 2.0);
                wt += w;
                let mag = Vector3::dot(&pp, &dir);
                let grad = (&pp + dir) * (-f32::sin(mag * f)) * w;
                va += f32::cos(mag * f) * w;
                gradient += grad;
            }
        }
    }
    (va / wt, gradient / wt)
}

//This is where the magic happens
pub fn erode3d(p: &Vector3, noise_value: f32, out_gradient: &mut Vector3) -> f32 {
    let normal = p.normalize_to_new();
    //take the curl of the normal to get the gradient facing down the slope
    //Vector2(noiseGradient.y, noiseGradient.x).multiplyByFloats(1.0, -1.0);
    let mut dir = curl3d(out_gradient);
    dir -= &normal * Vector3::dot(&dir, &normal);

    //Now we compute another fbm type noise
    // erosion is a type of noise with a strong directionality
    //we pass in the direction based on the slope of the terrain
    //erosion also returns the slope. we add that to a running total
    //so that the direction of successive layers are based on the
    //past layers
    let mut h = 0.0;
    let mut erosion_gradient = Vector3::zero();
    let mut a = 0.7 * (smoothstep(0.1, 0.5, noise_value * 0.5 + 0.5)); //smooth the valleys
    let mut f = 1.0;
    for i in 0..5 {
        let sample_point = p * f;
        let mut local_dir = curl3d(&erosion_gradient);
        local_dir -= &normal * Vector3::dot(&local_dir, &normal);

        let (mut local_elevation, mut local_gradient) =
            erosion(&sample_point, &(&dir + &local_dir));

        local_elevation *= a;
        local_gradient *= a * f;

        h += local_elevation;
        erosion_gradient += local_gradient;

        a *= 0.4;
        f *= 2.0;
    }

    //remap height to [0,1] and add erosion
    //looks best when erosion amount is small
    //not sure about adding the normals together, but it looks okay
    //new Vector3(out_gradient.x + h.y, out_gradient.y + h.w, out_gradient.z + h.z);

    *out_gradient += &erosion_gradient;
    *out_gradient *= 1.0 / 30.0;

    let erosion_strength = 0.04;
    smoothstep(-1.0, 1.0, noise_value) + h * erosion_strength
}
