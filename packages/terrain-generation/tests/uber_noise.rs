use gilgamesh::mesh::Mesh;
use gilgamesh::{init_gilgamesh, start_gilgamesh};
use image::{ImageBuffer, Luma, Rgb};
use terrain_generation::utils::vector3::Vector3;

mod common;

use common::*;

use terrain_generation::landscape::uber_noise_layer::uber_noise_layer;

use std::f32::consts::PI;

#[test]
pub fn test_uber_noise() {
    let (width, height): (u32, u32) = (500, 500);

    let mut value_sphere_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut normal_sphere_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    let mut value_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut gradient_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    let uber_layer = uber_noise_layer(1.0, 5, 2.0, 2.0, 0.5);

    for u in 0..width {
        for v in 0..height {
            let phi = 2.0 * PI * (u as f32 / width as f32);
            let theta = PI * (v as f32 / height as f32);
            let sample_point_sphere = Vector3::new(
                5.0 * f32::sin(theta) * f32::cos(phi),
                5.0 * f32::cos(theta),
                5.0 * f32::sin(theta) * f32::sin(phi),
            );

            let mut gradient_sphere = Vector3::zero();
            let noise_value_sphere = uber_layer(&sample_point_sphere, SEED, &mut gradient_sphere);

            //gradient_sphere
            let image_value_sphere = (noise_value_sphere * 255.0) as u8;
            *(value_sphere_image.get_pixel_mut(u, v)) = Luma([image_value_sphere]);

            let normal_sphere = sample_point_sphere.normalize_to_new();
            let projected_gradient = &gradient_sphere
                - &(&normal_sphere * Vector3::dot(&gradient_sphere, &normal_sphere));

            let mut normal = (&normal_sphere - &projected_gradient).normalize_to_new();

            normal += 1.0;
            normal *= 255.0 / 2.0;
            *(normal_sphere_image.get_pixel_mut(u, v)) =
                Rgb([normal.x as u8, normal.y as u8, normal.z as u8]);

            let mut gradient = Vector3::new(0.0, 0.0, 0.0);
            let sample_point = Vector3::new(u as f32 / 100.0, v as f32 / 100.0, 0.0);

            let noise_value = uber_layer(&sample_point, SEED, &mut gradient);

            let image_value = (noise_value * 255.0) as u8;
            *(value_image.get_pixel_mut(u, v)) = Luma([image_value]);

            gradient += 1.0;
            gradient *= 255.0 / 2.0;
            *(gradient_image.get_pixel_mut(u, v)) =
                Rgb([gradient.x as u8, gradient.y as u8, gradient.z as u8]);
        }
    }

    value_sphere_image
        .save("test_outputs/uber_sphere.png")
        .unwrap();
    normal_sphere_image
        .save("test_outputs/uber_normal_sphere.png")
        .unwrap();

    value_image.save("test_outputs/uber.png").unwrap();
    gradient_image
        .save("test_outputs/uber_gradient.png")
        .unwrap();

    let mut app = init_gilgamesh();

    let procedural_plane = Mesh::new_procedural_terrain(
        10.0,
        2048,
        &|x, y| {
            0.5 * uber_layer(
                &Vector3::new(x, y, 0.0),
                SEED,
                &mut Vector3::new(0.0, 0.0, 0.0),
            )
        },
        0.3,
        &mut app.engine,
    );

    /*let sphere = Mesh::new_procedural_sphere(4.0, 128, &|x, y, z| {
        0.8 * uber_layer(&Vector3::new(x, y, z), SEED, &mut Vector3::new(0.0, 0.0, 0.0))
    }, 0.9, &mut app.engine);*/

    app.scene.add_mesh(procedural_plane);

    start_gilgamesh(app);
}
