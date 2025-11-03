use chrono::prelude::*;
use image::{ImageBuffer, Luma, Rgb};
use terrain_generation::build_chunk_vertex_data;
use terrain_generation::build_data::BuildData;
use terrain_generation::utils::direction::Direction;
use terrain_generation::utils::vector3::Vector3;

mod common;

use common::*;

#[test]
pub fn build_chunk_data() {
    let start_time = Utc::now();
    // Setting up planetary data
    let build_data = BuildData {
        planet_diameter: PLANET_RADIUS * 2.0,
        chunk_depth: 0,
        chunk_tree_direction: Direction::Forward,
        chunk_cube_position_x: 0.0,
        chunk_cube_position_y: 0.0,
        chunk_cube_position_z: -PLANET_RADIUS,
        planet_seed: SEED,
        resolution: 64,
        terrain_settings: SETTINGS,
    };

    let nb_subdivisions = build_data.resolution - 1;

    // initialization of empty buffers
    let mut positions: Vec<f32> =
        vec![0.0; (build_data.resolution * build_data.resolution * 3) as usize];
    let mut normals: Vec<f32> =
        vec![0.0; (build_data.resolution * build_data.resolution * 3) as usize];
    let mut indices: Vec<u16> = vec![0; (nb_subdivisions * nb_subdivisions * 2 * 3) as usize];

    let size = build_data.planet_diameter / i32::pow(2, build_data.chunk_depth) as f32;
    let space_between_vertices = size / nb_subdivisions as f32;
    println!("space_between_vertices: {}", space_between_vertices);
    let scatter_per_square_meter = if space_between_vertices < 3.0 {
        0.1
    } else {
        0.0
    };
    println!("scatter_per_square_meter: {}", scatter_per_square_meter);
    let flat_area = size * size;
    let max_nb_instances = f32::floor(flat_area * scatter_per_square_meter * 2.0) as usize;
    println!("max_nb_instances: {}", max_nb_instances);
    let mut instances_matrix_buffer = vec![0.0; 16 * max_nb_instances];
    let mut aligned_instances_matrix_buffer = vec![0.0; 16 * max_nb_instances];

    // filling the buffers with vertex data
    let nb_instances = build_chunk_vertex_data(
        &build_data,
        &mut positions,
        &mut indices,
        &mut normals,
        &mut instances_matrix_buffer,
        &mut aligned_instances_matrix_buffer,
        scatter_per_square_meter,
    );

    assert!(
        nb_instances.nb_instances_created <= max_nb_instances,
        "generated {} instances but buffer allows {}",
        nb_instances.nb_instances_created,
        max_nb_instances
    );
    assert!(nb_instances.average_height.is_finite());

    println!("matrix_buffer: {:?}", instances_matrix_buffer);
    println!(
        "aligned_matrix_buffer: {:?}",
        aligned_instances_matrix_buffer
    );

    println!(
        "Chunk took {}ms to be generated",
        (Utc::now() - start_time).num_milliseconds()
    );

    // writing the data to images for verification purposes
    let mut chunk_normals_image =
        ImageBuffer::<Rgb<u8>, Vec<u8>>::new(build_data.resolution, build_data.resolution);
    let mut chunk_elevation_image =
        ImageBuffer::<Luma<u8>, Vec<u8>>::new(build_data.resolution, build_data.resolution);

    for u in 0..build_data.resolution {
        for v in 0..build_data.resolution {
            let normal_x = normals[((u * build_data.resolution + v) * 3) as usize];
            let normal_y = normals[((u * build_data.resolution + v) * 3 + 1) as usize];
            let normal_z = normals[((u * build_data.resolution + v) * 3 + 2) as usize];

            //println!("{normal_x} {normal_y} {normal_z}");

            let normal_r = ((normal_x + 1.0) * 255.0 / 2.0) as u8;
            let normal_g = ((normal_y + 1.0) * 255.0 / 2.0) as u8;
            let normal_b = ((normal_z + 1.0) * 255.0 / 2.0) as u8;

            *(chunk_normals_image.get_pixel_mut(u, v)) = Rgb([normal_r, normal_g, normal_b]);

            let pos_x = positions[((u * build_data.resolution + v) * 3) as usize];
            let pos_y = positions[((u * build_data.resolution + v) * 3 + 1) as usize];
            let pos_z = positions[((u * build_data.resolution + v) * 3 + 2) as usize];

            // artificially moving the vertex back into its planet position (can be done because front face and depth=0)
            let position = Vector3::new(pos_x, pos_y, pos_z + build_data.chunk_cube_position_z);
            let elevation = position.length();

            let elevation01 = (elevation - (build_data.planet_diameter / 2.0))
                / (build_data.terrain_settings.continent_base_height
                    + build_data.terrain_settings.max_mountain_height
                    + build_data.terrain_settings.max_bump_height);
            assert!((0.0..=1.0).contains(&elevation01));
            let elevation255 = (elevation01 * 255.0) as u8;
            *(chunk_elevation_image.get_pixel_mut(u, v)) = Luma([elevation255]);
        }
    }

    chunk_normals_image
        .save("test_outputs/chunk_normals.png")
        .unwrap();
    chunk_elevation_image
        .save("test_outputs/chunk_elevation.png")
        .unwrap();
}
