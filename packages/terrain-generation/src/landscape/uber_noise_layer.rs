use crate::utils::math::{s_abs, s_max_gradient};
use crate::utils::simplex;
use crate::utils::simplex::simplex411;
use crate::utils::vector3::Vector3;

pub fn uber_noise_layer(
    frequency: f32,
    nb_octaves: i32,
    decay: f32,
    lacunarity: f32,
    threshold: f32,
) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    move |coords: &Vector3, seed: f32, gradient: &mut Vector3| {
        let mut noise_value = 0.0;
        let mut amplitude = 1.0;
        let mut total_amplitude = 0.0;
        let mut local_gradient = Vector3::zero();
        for i in 0..nb_octaves {
            let local_frequency = frequency * f32::powi(lacunarity, i);
            let mut local_noise_value = if i != 0 {
                let local_noise_value =
                    simplex::simplex401(&(coords * local_frequency), seed, &mut local_gradient);
                local_gradient *= local_frequency;
                local_noise_value
            } else {
                let mut local_noise_value =
                    simplex411(&(coords * local_frequency), seed, &mut local_gradient);
                local_gradient *= local_frequency;
                local_noise_value = 1.0 - s_abs(local_noise_value, 4.0, &mut local_gradient);
                local_gradient *= -1.0;
                local_noise_value
            };

            let local_amplitude =
                amplitude / (1.0 + local_gradient.length() * local_gradient.length());
            total_amplitude += local_amplitude;

            local_noise_value *= local_amplitude;
            local_gradient *= local_amplitude;

            noise_value += local_noise_value;
            *gradient += &local_gradient;

            amplitude /= decay;

            // rotate sample point
            /*let theta = 1.3;
            sample_point = Vector3::new(
                sample_point.x * f32::cos(theta) - sample_point.y * f32::sin(theta),
                sample_point.x * f32::sin(theta) + sample_point.y * f32::cos(theta),
                sample_point.z,
            );*/
        }
        noise_value /= total_amplitude;
        *gradient /= total_amplitude;

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
