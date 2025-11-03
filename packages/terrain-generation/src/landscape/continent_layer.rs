use crate::utils::math::{multiply, smoothstep};
use crate::utils::simplex::simplex401;
use crate::utils::vector3::Vector3;

pub fn continent_layer(
    frequency: f32,
    continents_fragmentation: f32,
) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    move |coords: &Vector3, seed: f32, gradient: &mut Vector3| {
        let decay = 2.0;
        let lacunarity = 2.0;
        let nb_octaves = 6;
        let mut noise_value = 0.0;
        let mut total_amplitude = 0.0;
        let mut local_gradient = Vector3::zero();
        for i in 0..nb_octaves {
            let local_frequency = frequency * f32::powi(lacunarity, i);
            let local_amplitude = 1.0 / f32::powi(decay, i);

            let mut local_elevation =
                simplex401(&(coords * local_frequency), seed, &mut local_gradient);
            local_gradient *= local_frequency;

            local_elevation = smoothstep(0.1, 1.0, local_elevation, &mut local_gradient);

            local_elevation *= local_amplitude;
            local_gradient *= local_amplitude;

            total_amplitude += local_amplitude;

            noise_value += local_elevation;
            *gradient += &local_gradient;
        }
        noise_value /= total_amplitude;
        *gradient /= total_amplitude;

        smoothstep(continents_fragmentation, 1.0, noise_value, gradient);

        let mut detail_gradient = Vector3::zero();
        let mut detail_noise = simplex401(&(coords * 10.0), seed, &mut detail_gradient);
        detail_gradient *= 10.0;

        detail_noise = multiply(detail_noise, noise_value, &mut detail_gradient, gradient);

        noise_value -= detail_noise * 0.3;
        *gradient -= &(detail_gradient * 0.3);

        noise_value
    }
}
