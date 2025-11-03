pub mod build_data;
pub mod landscape;
pub mod return_data;
pub mod terrain_settings;
pub mod utils;

use crate::build_data::BuildData;
use crate::landscape::make_terrain_function::TerrainFunction;
use crate::return_data::ReturnData;
use crate::utils::direction::Direction;
use crate::utils::triangle::scatter_in_triangle;
use crate::utils::vector3::Vector3;
use landscape::make_terrain_function::make_terrain_function;
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

struct TerrainCache {
    seed: f32,
    function: Box<TerrainFunction>,
}

thread_local! {
    static TERRAIN_CACHE: RefCell<Option<TerrainCache>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
/// Fills the given buffers with the vertex data from the chunk
/// * `data` - The data needed to guide the build process
/// * `positions` - A mutable reference to the buffer that will be filled with vertex positions
/// * `indices` - A mutable reference to the buffer that will be filled with the face indices
/// * `normals` - A mutable reference to the buffer that will be filled with the vertex normals
pub fn build_chunk_vertex_data(
    data: &BuildData,
    positions: &mut [f32],
    indices: &mut [u16],
    normals: &mut [f32],
    instances_matrix_buffer: &mut [f32],
    aligned_instances_matrix_buffer: &mut [f32],
    scatter_per_square_meter: f32,
) -> ReturnData {
    let planet_diameter = data.planet_diameter;
    let depth = data.chunk_depth;
    let direction = data.chunk_tree_direction;
    let chunk_cube_position = Vector3::new(
        data.chunk_cube_position_x,
        data.chunk_cube_position_y,
        data.chunk_cube_position_z,
    );

    let seed = data.planet_seed;

    let chunk_size = planet_diameter / i32::pow(2, depth) as f32;
    let planet_radius = planet_diameter / 2.0;

    let nb_vertices_per_row = data.resolution as usize;
    let nb_subdivisions = nb_vertices_per_row - 1;

    let rescale_factor = chunk_size / nb_subdivisions as f32;

    let mut instance_index: usize = 0;
    let mut excess_instance_number: f32 = 0.0;

    // the offset used to bring back the vertices close to the origin (the position of the chunk on the sphere)
    let mut chunk_sphere_position = chunk_cube_position.clone();
    chunk_sphere_position.set_magnitude_in_place(planet_radius);

    let mut height_acc = 0.0;

    TERRAIN_CACHE.with(|cache| {
        let mut cache_mut = cache.borrow_mut();
        if cache_mut
            .as_ref()
            .map(|state| state.seed == seed)
            .unwrap_or(false)
        {
            // cache is already initialised with the current seed
        } else {
            *cache_mut = Some(TerrainCache {
                seed,
                function: make_terrain_function(data.terrain_settings),
            });
        }

        let terrain_function = &mut cache_mut
            .as_mut()
            .expect("terrain function cache should be initialized")
            .function;

        for x in 0..nb_vertices_per_row {
            for y in 0..nb_vertices_per_row {
                // create flat plane with the right orientation
                let mut vertex_position = match direction {
                    Direction::Forward => Vector3::new(
                        x as f32 - nb_subdivisions as f32 / 2.0,
                        y as f32 - nb_subdivisions as f32 / 2.0,
                        0.0,
                    ),
                    Direction::Backward => Vector3::new(
                        y as f32 - nb_subdivisions as f32 / 2.0,
                        x as f32 - nb_subdivisions as f32 / 2.0,
                        0.0,
                    ),
                    Direction::Left => Vector3::new(
                        0.0,
                        x as f32 - nb_subdivisions as f32 / 2.0,
                        y as f32 - nb_subdivisions as f32 / 2.0,
                    ),
                    Direction::Right => Vector3::new(
                        0.0,
                        y as f32 - nb_subdivisions as f32 / 2.0,
                        x as f32 - nb_subdivisions as f32 / 2.0,
                    ),
                    Direction::Up => Vector3::new(
                        x as f32 - nb_subdivisions as f32 / 2.0,
                        0.0,
                        y as f32 - nb_subdivisions as f32 / 2.0,
                    ),
                    Direction::Down => Vector3::new(
                        y as f32 - nb_subdivisions as f32 / 2.0,
                        0.0,
                        x as f32 - nb_subdivisions as f32 / 2.0,
                    ),
                };

                // resize the plane to the size of the chunk
                vertex_position *= rescale_factor;

                // move it to the surface of the cube sphere
                vertex_position += &chunk_cube_position;

                // normalize and then scale to planet radius to morph the cube into a sphere
                vertex_position.set_magnitude_in_place(planet_radius);

                // apply terrain function to the current vertex (use normalized coordinates for scale invariance)
                let unit_sphere_coords = vertex_position.normalize_to_new();
                let mut vertex_gradient = Vector3::zero();
                terrain_function(
                    &unit_sphere_coords,
                    seed,
                    &mut vertex_position,
                    &mut vertex_gradient,
                );
                vertex_gradient /= planet_radius;

                height_acc += vertex_position.length() - planet_radius;

                // Resource: https://math.stackexchange.com/questions/1071662/surface-normal-to-point-on-displaced-sphere
                // project the gradient onto the tangent plane to the sphere at the current vertex
                let h = &vertex_gradient
                    - &(&unit_sphere_coords * Vector3::dot(&vertex_gradient, &unit_sphere_coords));

                // the normal of the terrain is the default terrain minus the projection of the gradient
                let mut vertex_normal = &unit_sphere_coords - &h;
                vertex_normal.normalize_in_place();

                // Move back the vertex data to the origin of the chunk to avoid floating point precision issues
                vertex_position -= &chunk_sphere_position;

                // fill position and normal buffers with the computed data
                let vertex_index = x * nb_vertices_per_row + y;
                positions[3 * vertex_index] = vertex_position.x;
                positions[3 * vertex_index + 1] = vertex_position.y;
                positions[3 * vertex_index + 2] = vertex_position.z;

                normals[3 * vertex_index] = vertex_normal.x;
                normals[3 * vertex_index + 1] = vertex_normal.y;
                normals[3 * vertex_index + 2] = vertex_normal.z;

                // Triangle winding only starts after the first row and column
                if x == 0 || y == 0 {
                    continue;
                }

                let indices_index = 6 * ((x - 1) * nb_subdivisions + (y - 1));
                indices[indices_index] = (vertex_index - 1) as u16;
                indices[indices_index + 1] = vertex_index as u16;
                indices[indices_index + 2] = (vertex_index - nb_vertices_per_row - 1) as u16;

                indices[indices_index + 3] = vertex_index as u16;
                indices[indices_index + 4] = (vertex_index - nb_vertices_per_row) as u16;
                indices[indices_index + 5] = (vertex_index - nb_vertices_per_row - 1) as u16;

                let index = vertex_index;

                scatter_in_triangle(
                    &chunk_sphere_position,
                    scatter_per_square_meter,
                    &mut excess_instance_number,
                    &mut instance_index,
                    instances_matrix_buffer,
                    aligned_instances_matrix_buffer,
                    positions,
                    normals,
                    &unit_sphere_coords,
                    index - 1,
                    index,
                    index - nb_vertices_per_row - 1,
                );

                scatter_in_triangle(
                    &chunk_sphere_position,
                    scatter_per_square_meter,
                    &mut excess_instance_number,
                    &mut instance_index,
                    instances_matrix_buffer,
                    aligned_instances_matrix_buffer,
                    positions,
                    normals,
                    &unit_sphere_coords,
                    index,
                    index - nb_vertices_per_row,
                    index - nb_vertices_per_row - 1,
                );
                if instance_index > aligned_instances_matrix_buffer.len() / 16 {
                    panic!(
                        "Too many instances: {} > {}",
                        instance_index,
                        aligned_instances_matrix_buffer.len() / 16
                    );
                }
            }
        }
    });

    ReturnData {
        nb_instances_created: instance_index,
        average_height: height_acc / (nb_vertices_per_row * nb_vertices_per_row) as f32,
    }
}
