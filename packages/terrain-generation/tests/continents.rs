use image::{ImageBuffer, Luma};
use terrain_generation::landscape::continent_layer::continent_layer;
use terrain_generation::utils::vector3::Vector3;

mod common;

use common::*;

#[test]
fn continents() {
    let terrain = continent_layer(
        SETTINGS.continents_frequency,
        SETTINGS.continents_fragmentation,
    );

    let sample_point = Vector3::new(0.0, 1000e3, 0.0);
    let unit_sample_point = &sample_point / sample_point.length();
    let mut gradient = unit_sample_point.clone();

    let elevation = terrain(&unit_sample_point, SEED, &mut gradient);

    assert!((0.0..=1.0).contains(&elevation));

    let (width, height) = ((300.0 * 1.65) as u32, 300);

    let mut value_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut flat_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);

    for u in 0..width {
        for v in 0..height {
            let phi = 2.0 * std::f32::consts::PI * (u as f32 / width as f32);
            let theta = std::f32::consts::PI * (v as f32 / height as f32);
            let sample_point = Vector3::new(
                f32::sin(theta) * f32::cos(phi),
                f32::cos(theta),
                f32::sin(theta) * f32::sin(phi),
            );
            let mut gradient = Vector3::new(0.0, 0.0, 0.0);

            let elevation = terrain(&sample_point, SEED, &mut gradient);

            let sample_point_flat = Vector3::new(u as f32 / 40.0, v as f32 / 40.0, 0.0);

            let flat_elevation = terrain(&sample_point_flat, SEED, &mut gradient);

            *(value_image.get_pixel_mut(u, v)) = Luma([(elevation * 255.0) as u8]);

            *(flat_image.get_pixel_mut(u, v)) = Luma([(flat_elevation * 255.0) as u8]);
        }
    }

    value_image
        .save("test_outputs/continent_elevation.png")
        .unwrap();
    flat_image.save("test_outputs/continent_layer.png").unwrap();
}
