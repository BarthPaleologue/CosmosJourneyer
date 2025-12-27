use crate::utils::vector3::Vector3;
use wasm_bindgen::prelude::*;

// https://www.desmos.com/calculator/968c7smugx
/**
 * Smooth minimum between a and b
 * @param a the first value
 * @param b the second value
 * @param k the smoothness factor
 * @returns the smooth minimum between a and b
 */
#[wasm_bindgen]
pub fn s_min(a: f32, b: f32, k: f32) -> f32 {
    let res = f32::exp(-k * a) + f32::exp(-k * b);
    -f32::ln(res) / k
}

/**
 * Smooth maximum between a and b
 * @param a the first value
 * @param b the second value
 * @param k the smoothness factor (should be > 1)
 * @returns the smooth maximum between a and b
 */
#[wasm_bindgen]
pub fn s_max(a: f32, b: f32, k: f32) -> f32 {
    let res = f32::exp(k * a) + f32::exp(k * b);
    f32::ln(res) / k
}

// based on research folder
/**
 * The smooth minimum between u and v and computes the gradient
 * @param u the first value (should be in [0, 1])
 * @param v the second value (should be in [0, 1])
 * @param k the smoothness factor (should be > 1)
 * @param grad_u the gradient of u
 * @param grad_v the gradient of v
 * @returns the smooth minimum between u and v
 */
pub fn s_min_gradient(u: f32, v: f32, k: f32, grad_u: &mut Vector3, grad_v: &Vector3) -> f32 {
    let eku = f32::exp(k * u);
    let ekv = f32::exp(k * v);
    let ekuv = eku + ekv;

    grad_u.x = (eku * grad_v.x + ekv * grad_u.x) / ekuv;
    grad_u.y = (eku * grad_v.y + ekv * grad_u.y) / ekuv;
    grad_u.z = (eku * grad_v.z + ekv * grad_u.z) / ekuv;

    s_min(u, v, k)
}

/**
 * The smooth maximum between u and v and computes the gradient
 * @param u the first value
 * @param v the second value
 * @param k the smoothness factor
 * @param grad_u the gradient of u
 * @param grad_v the gradient of v
 * @returns the smooth maximum between u and v and overrides grad_u with the new gradient
 */
pub fn s_max_gradient(u: f32, v: f32, k: f32, grad_u: &mut Vector3, grad_v: &mut Vector3) -> f32 {
    let eku = f32::exp(k * u);
    let ekv = f32::exp(k * v);
    let ekuv = eku + ekv;

    *grad_u *= eku / ekuv;
    *grad_v *= ekv / ekuv;

    f32::ln(ekuv) / k
}

/**
 * Applies smooth min to a value and scales the optional gradient accordingly.
 * @param x the value to apply the smooth min to
 * @param ceil the ceil value
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the result of the smooth min
 */
pub fn s_ceil(x: f32, ceil: f32, k: f32, grad: &mut Vector3) -> f32 {
    let emkx = f32::exp(-k * x);
    let emkceil = f32::exp(-k * ceil);

    *grad *= -emkx / (emkx + emkceil);

    -f32::ln(emkx + emkceil) / k
}

/**
 * Applies smooth max to value and scales the optional gradient accordingly
 * @param x the value to apply the smooth max to
 * @param floor the floor value
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the smooth max value between floor and x
 */
pub fn s_floor(x: f32, floor: f32, k: f32, grad: &mut Vector3) -> f32 {
    let ekx = f32::exp(k * x);
    let ekfloor = f32::exp(k * floor);

    *grad *= ekx / (ekx + ekfloor);

    f32::ln(ekx + ekfloor) / k
}

/**
 * Applies smooth absolute to a value and scales the optional gradient accordingly
 * @param x the value to apply the smooth absolute to
 * @param k the smoothness factor
 * @param grad the optional gradient to be modified
 * @returns the smooth absolute value of x
 */
pub fn s_abs(x: f32, k: f32, grad: &mut Vector3) -> f32 {
    let ekx = f32::exp(k * x);
    let emkx = 1.0 / ekx;

    *grad *= (ekx - emkx) / (ekx + emkx);

    f32::ln(ekx + emkx) / k
}

//https://www.desmos.com/calculator/xtepjehtuf?lang=fr
/**
 * Applies tanh-based interpolation to x given s the sharpness parameter and alters the gradient accordingly
 * @param x The value to interpolate
 * @param s The sharpness factor
 * @param grad The gradient to alter
 */
pub fn tanh_sharpen(x: f32, s: f32, grad: &mut Vector3) -> f32 {
    let sample_x = s * (x - 0.5);
    let tanh_x = f32::tanh(sample_x);
    let tanh_half_s = f32::tanh(0.5 * s);

    *grad *= (0.5 * s * (1.0 - f32::powi(tanh_x, 2))) / tanh_half_s;

    0.5 * (1.0 + tanh_x / tanh_half_s)
}

/**
 * Applies power function to a value and scales the optional gradient accordingly
 * @param y the value to apply the power function to
 * @param exponent the exponent of the power function
 * @param grad the optional gradient to be modified
 */
pub fn pow(y: f32, exponent: f32, grad: &mut Vector3) -> f32 {
    *grad *= exponent * f32::powf(y, exponent - 1.0);
    f32::powf(y, exponent)
}

pub fn minimum_value(y: f32, min_value: f32, grad: &mut Vector3) -> f32 {
    let new_y = s_floor(y - min_value, 0.0, 100.0, grad) / (1.0 - min_value);
    *grad /= 1.0 - min_value;
    new_y
}

/**
 * Adds two values and adds the optional gradients in grad1
 * @param x1 the first value
 * @param x2 the second value
 * @param grad1 the optional gradient of x1 WILL STORE THE RESULT
 * @param grad2 the optional gradient of x2
 */
pub fn add(x1: f32, x2: f32, grad1: &mut Vector3, grad2: &Vector3) -> f32 {
    *grad1 += grad2;
    x1 + x2
}

/**
 * Scales the value and the optional gradient accordingly
 * @param x the value to scale
 * @param scale the scale factor
 * @param grad the optional gradient to be modified
 */
pub fn scale(x: f32, scale: f32, grad: &mut Vector3) -> f32 {
    *grad *= scale;
    x * scale
}

/**
 * Applies smoothstep to a value and scales the optional gradient accordingly
 * @param edge0 the minimum value of the smoothstep
 * @param edge1 the maximum value of the smoothstep
 * @param x the value to apply the smoothstep to (must be between edge0 and edge1)
 * @param grad? the optional gradient to be modified
 * @see https://www.wikiwand.com/en/Smoothstep
 */
pub fn smoothstep(edge0: f32, edge1: f32, x: f32, grad: &mut Vector3) -> f32 {
    // when outside of the smoothstep range, the gradient is 0
    if x <= edge0 {
        *grad *= 0.0;
        return 0.0;
    } else if x >= edge1 {
        *grad *= 0.0;
        return 1.0;
    }
    let t = f32::clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    let t2 = t * t;
    let t3 = t2 * t;

    *grad *= 6.0 * t2 * (1.0 - t) / (edge1 - edge0);

    3.0 * t2 - 2.0 * t3
}

/**
 * Multiplies x1 and x2 and scales the optional gradient accordingly and stores it in grad1
 * @param x1 the first value
 * @param x2 the second value
 * @param grad1 the gradient of x1 WILL STORE THE RESULT
 * @param grad2 the gradient of x2 WILL NOT BE MODIFIED
 */
pub fn multiply(x1: f32, x2: f32, grad1: &mut Vector3, grad2: &Vector3) -> f32 {
    *grad1 *= x2;
    *grad1 += x1 * grad2;

    x1 * x2
}

#[wasm_bindgen]
pub fn gcd(a: f32, b: f32) -> f32 {
    if b == 0.0 {
        a
    } else {
        gcd(b, a % b)
    }
}

pub fn ray_intersect_sphere(
    ray_origin: Vector3,
    ray_dir: Vector3,
    sphere_position: Vector3,
    sphere_radius: f32,
) -> (bool, f32, f32) {
    let relative_origin = &ray_origin - &sphere_position; // rayOrigin in sphere space

    let a = 1.0;
    let b = 2.0 * Vector3::dot(&relative_origin, &ray_dir);
    let c = Vector3::dot(&relative_origin, &relative_origin) - f32::powi(sphere_radius, 2);

    let d = b * b - 4.0 * a * c;

    if d < 0.0 {
        return (false, 0.0, 0.0);
    } // no intersection

    let s = f32::sqrt(d);

    let r0 = (-b - s) / (2.0 * a);
    let r1 = (-b + s) / (2.0 * a);

    let t0 = f32::max(f32::min(r0, r1), 0.0);
    let t1 = f32::max(f32::max(r0, r1), 0.0);

    (t1 > 0.0, t0, t1)
}

#[wasm_bindgen]
pub fn clamp(x: f32, min: f32, max: f32) -> f32 {
    if x < min {
        return min;
    }
    if x > max {
        return max;
    }
    x
}
