use crate::landscape::simple_fractal_layer::simple_fractal_layer;
use crate::utils::simplex::simplex401;
use crate::utils::vector3::Vector3;

pub fn simplex_noise_layer(
    frequency: f32,
    nb_octaves: i32,
    decay: f32,
    lacunarity: f32,
    power: f32,
) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    simple_fractal_layer(frequency, nb_octaves, decay, lacunarity, power, simplex401)
}
