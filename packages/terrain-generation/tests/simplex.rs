use float_eq::assert_float_eq;
use image::{ImageBuffer, Luma, Rgb};
use terrain_generation::utils::vector3::Vector3;

use terrain_generation::utils::simplex;

mod common;
use common::*;
use terrain_generation::utils::simplex::simplex401;

#[test]
pub fn simplex() {
    let (width, height) = ((200.0 * 1.65) as u32, 200);

    let mut value_sphere_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut gradient_sphere_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    let mut value_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut gradient_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    for u in 0..width {
        for v in 0..height {
            let phi = 2.0 * 3.14 * (u as f32 / width as f32);
            let theta = 3.14 * (v as f32 / height as f32);
            let sample_point_sphere = Vector3::new(
                5.0 * f32::sin(theta) * f32::cos(phi),
                5.0 * f32::cos(theta),
                5.0 * f32::sin(theta) * f32::sin(phi),
            );
            let mut gradient_sphere = Vector3::new(0.0, 0.0, 0.0);

            let noise_value_sphere = simplex401(&sample_point_sphere, SEED, &mut gradient_sphere);

            let image_value_sphere = (noise_value_sphere * 255.0) as u8;
            *(value_sphere_image.get_pixel_mut(u, v)) = Luma([image_value_sphere]);

            gradient_sphere += 1.0;
            gradient_sphere *= 255.0 / 2.0;
            *(gradient_sphere_image.get_pixel_mut(u, v)) = Rgb([
                gradient_sphere.x as u8,
                gradient_sphere.y as u8,
                gradient_sphere.z as u8,
            ]);

            let mut gradient = Vector3::new(0.0, 0.0, 0.0);
            let sample_point = Vector3::new(u as f32 / 10.0, v as f32 / 10.0, 0.0);
            let noise_value = simplex::simplex401(&sample_point, SEED, &mut gradient);

            let image_value = (noise_value * 255.0) as u8;
            *(value_image.get_pixel_mut(u, v)) = Luma([image_value]);

            gradient += 1.0;
            gradient *= 255.0 / 2.0;
            *(gradient_image.get_pixel_mut(u, v)) =
                Rgb([gradient.x as u8, gradient.y as u8, gradient.z as u8]);
        }
    }

    value_sphere_image
        .save("test_outputs/simplex4_sphere.png")
        .unwrap();
    gradient_sphere_image
        .save("test_outputs/simplex4_gradient_sphere.png")
        .unwrap();

    value_image.save("test_outputs/simplex4.png").unwrap();
    gradient_image
        .save("test_outputs/simplex4_gradient.png")
        .unwrap();
}

#[test]
pub fn average_simplex() {
    let nb_samples = 100;
    let mut acc = 0.0;
    for x in 0..nb_samples {
        for y in 0..nb_samples {
            for z in 0..nb_samples {
                acc += simplex401(
                    &Vector3::new(x as f32, y as f32, z as f32),
                    0.0,
                    &mut Vector3::zero(),
                );
            }
        }
    }

    let average = acc / (nb_samples * nb_samples * nb_samples) as f32;
    assert_float_eq!(average, 0.5, rmax <= 0.05);
}
