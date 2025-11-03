use crate::utils::math::{s_abs, s_max_gradient};
use crate::utils::simplex::simplex411;
use crate::utils::vector3::Vector3;

pub fn mountain_layer(
    frequency: f32,
    nb_octaves: i32,
    decay: f32,
    lacunarity: f32,
    threshold: f32,
) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    move |coords: &Vector3, seed: f32, gradient: &mut Vector3| {
        let mut noise_value = 0.0;
        let mut total_amplitude = 0.0;
        let mut local_gradient = Vector3::zero();
        for i in 0..nb_octaves {
            let local_frequency = frequency * f32::powi(lacunarity, i);
            let mut local_elevation =
                simplex411(&(coords * local_frequency), seed, &mut local_gradient);
            local_gradient *= local_frequency;

            // TODO: ne pas hardcoder
            let sharpness = 4.0;
            local_elevation = 1.0 - s_abs(local_elevation, sharpness, &mut local_gradient);

            local_gradient *= -1.0;

            local_elevation /= f32::powi(decay, i);
            local_gradient /= f32::powi(decay, i);

            noise_value += local_elevation;
            *gradient += &local_gradient;

            total_amplitude += 1.0 / f32::powi(decay, i);
        }

        noise_value /= total_amplitude;
        *gradient /= total_amplitude;

        //pow(noise_value, power, gradient)

        noise_value = s_max_gradient(
            noise_value,
            threshold,
            10.0,
            gradient,
            &mut Vector3::new(0.0, 0.0, 0.0),
        );

        noise_value -= threshold;

        noise_value /= 1.0 - threshold;
        *gradient /= 1.0 - threshold;

        noise_value
    }
}
