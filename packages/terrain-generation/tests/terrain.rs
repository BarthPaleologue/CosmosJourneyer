use gilgamesh::mesh::Mesh;
use gilgamesh::{init_gilgamesh, start_gilgamesh};
use image::{ImageBuffer, Luma, Rgb};

use terrain_generation::landscape::make_terrain_function::make_terrain_function;
use terrain_generation::utils::vector3::Vector3;

mod common;

use common::*;

#[test]
fn see_terrain_function() {
    let terrain = make_terrain_function(SETTINGS);

    let mut app = init_gilgamesh();

    let _procedural_plane = Mesh::new_procedural_terrain(
        10.0,
        512,
        &|x, y| {
            let mut sample_point = Vector3::new(x, y, 0.0) * 0.05;
            let unit_sample_point = sample_point.clone();
            let mut gradient = Vector3::new(0.0, 0.0, 0.0);
            terrain(&unit_sample_point, SEED, &mut sample_point, &mut gradient);

            (sample_point.length() - unit_sample_point.length()) / 10e3
        },
        1.0,
        &mut app.engine,
    );

    let procedural_sphere = Mesh::new_procedural_sphere(
        5.0,
        512,
        &|x, y, z| {
            let mut sample_point_sphere = Vector3::new(x, y, z);

            let unit_sample_point = sample_point_sphere.normalize_to_new();

            let mut gradient_sphere = Vector3::new(0.0, 0.0, 0.0);

            let base_elevation = sample_point_sphere.length();
            terrain(
                &unit_sample_point,
                SEED,
                &mut sample_point_sphere,
                &mut gradient_sphere,
            );

            (sample_point_sphere.length() - base_elevation) / 200e3
        },
        1.0,
        &mut app.engine,
    );

    //app.scene.add_mesh(procedural_sphere);
    app.scene.add_mesh(procedural_sphere);

    start_gilgamesh(app);
}

#[test]
fn terrain_function() {
    let terrain = make_terrain_function(SETTINGS);

    let mut sample_point = Vector3::new(0.0, PLANET_RADIUS, 0.0);
    let elevation = sample_point.length();
    let unit_sample_point = &sample_point / elevation;
    let mut gradient = Vector3::zero();

    terrain(&unit_sample_point, SEED, &mut sample_point, &mut gradient);
    gradient /= PLANET_RADIUS;

    assert!(sample_point.length() >= elevation);

    let (width, height) = ((500.0 * 1.65) as u32, 500);

    let mut value_image = ImageBuffer::<Luma<u8>, Vec<u8>>::new(width, height);
    let mut gradient_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);
    let mut normal_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    let mut simplified_image = ImageBuffer::<Rgb<u8>, Vec<u8>>::new(width, height);

    for u in 0..width {
        for v in 0..height {
            let phi = 2.0 * std::f32::consts::PI * (u as f32 / width as f32);
            let theta = std::f32::consts::PI * (v as f32 / height as f32);
            let mut sample_point = Vector3::new(
                PLANET_RADIUS * f32::sin(theta) * f32::cos(phi),
                PLANET_RADIUS * f32::cos(theta),
                PLANET_RADIUS * f32::sin(theta) * f32::sin(phi),
            );
            let unit_sphere_coords = &sample_point / PLANET_RADIUS;

            let mut gradient = Vector3::zero();

            terrain(&unit_sphere_coords, SEED, &mut sample_point, &mut gradient);

            gradient /= PLANET_RADIUS;

            let h =
                &gradient - &(&unit_sphere_coords * Vector3::dot(&gradient, &unit_sphere_coords));

            let mut vertex_normal = &unit_sphere_coords - &h;
            vertex_normal.normalize_in_place();

            let new_elevation = sample_point.length();

            *(simplified_image.get_pixel_mut(u, v)) = if new_elevation - PLANET_RADIUS > OCEAN_DEPTH
            {
                Rgb([0, 255, 0])
            } else {
                Rgb([0, 0, 255])
            };

            let image_value = (255.0 * (new_elevation - PLANET_RADIUS)
                / (SETTINGS.continent_base_height
                    + SETTINGS.max_bump_height
                    + SETTINGS.max_mountain_height)) as u8;
            *(value_image.get_pixel_mut(u, v)) = Luma([image_value]);

            gradient += 1.0;
            gradient *= 255.0 / 2.0;
            *(gradient_image.get_pixel_mut(u, v)) =
                Rgb([gradient.x as u8, gradient.y as u8, gradient.z as u8]);

            vertex_normal += 1.0;
            vertex_normal *= 255.0 / 2.0;
            *(normal_image.get_pixel_mut(u, v)) = Rgb([
                vertex_normal.x as u8,
                vertex_normal.y as u8,
                vertex_normal.z as u8,
            ]);
        }
    }

    value_image
        .save("test_outputs/full_terrain_elevation.png")
        .unwrap();
    gradient_image
        .save("test_outputs/full_terrain_gradient.png")
        .unwrap();
    normal_image
        .save("test_outputs/full_terrain_normal.png")
        .unwrap();
    simplified_image
        .save("test_outputs/full_terrain_colored.png")
        .unwrap();
}
