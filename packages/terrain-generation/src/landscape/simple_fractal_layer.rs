use crate::utils::math;
use crate::utils::vector3::Vector3;

pub fn simple_fractal_layer(
    frequency: f32,
    nb_octaves: i32,
    decay: f32,
    lacunarity: f32,
    power: f32,
    f: impl Fn(&Vector3, f32, &mut Vector3) -> f32,
) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    move |coords: &Vector3, seed: f32, gradient: &mut Vector3| {
        let mut noise_value = 0.0;
        let total_amplitude = (1.0 - f32::powi(1.0 / decay, nb_octaves + 1)) / (1.0 - 1.0 / decay);
        let mut local_gradient = Vector3::zero();
        for i in 0..nb_octaves {
            let local_frequency = frequency * f32::powi(lacunarity, i);
            let local_elevation =
                f(&(coords * local_frequency), seed, &mut local_gradient) / f32::powi(decay, i);
            local_gradient *= local_frequency / f32::powi(decay, i);

            noise_value += local_elevation;
            *gradient += &local_gradient;
        }
        noise_value /= total_amplitude;
        *gradient /= total_amplitude;

        math::pow(noise_value, power, gradient)
    }
}
