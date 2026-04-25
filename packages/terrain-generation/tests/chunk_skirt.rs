use terrain_generation::build_chunk_vertex_data;
use terrain_generation::build_data::BuildData;
use terrain_generation::terrain_settings::TerrainSettings;
use terrain_generation::utils::direction::Direction;
use terrain_generation::utils::vector3::Vector3;

const PLANET_RADIUS: f32 = 10_000.0;
const RESOLUTION: usize = 8;

fn make_build_data() -> BuildData {
    BuildData {
        planet_diameter: PLANET_RADIUS * 2.0,
        chunk_depth: 0,
        chunk_tree_direction: Direction::Forward,
        chunk_cube_position_x: 0.0,
        chunk_cube_position_y: 0.0,
        chunk_cube_position_z: -PLANET_RADIUS,
        planet_seed: 42.0,
        resolution: RESOLUTION as u32,
        terrain_settings: TerrainSettings::new(),
    }
}

fn get_vertex(positions: &[f32], index: usize) -> Vector3 {
    Vector3::new(
        positions[3 * index],
        positions[3 * index + 1],
        positions[3 * index + 2],
    )
}

fn get_grid_index(row: usize, column: usize) -> usize {
    row * RESOLUTION + column
}

fn build_border_loops() -> [Vec<usize>; 4] {
    let mut top = Vec::with_capacity(RESOLUTION);
    let mut right = Vec::with_capacity(RESOLUTION);
    let mut bottom = Vec::with_capacity(RESOLUTION);
    let mut left = Vec::with_capacity(RESOLUTION);

    for i in 0..RESOLUTION {
        top.push(get_grid_index(0, i));
        right.push(get_grid_index(i, RESOLUTION - 1));
        bottom.push(get_grid_index(RESOLUTION - 1, i));
        left.push(get_grid_index(i, 0));
    }

    bottom.reverse();
    left.reverse();

    [top, right, bottom, left]
}

#[test]
fn chunk_skirt_triangles_face_toward_chunk_interior_on_all_edges() {
    let build_data = make_build_data();
    let nb_subdivisions = RESOLUTION - 1;
    let base_vertex_count = RESOLUTION * RESOLUTION;
    let skirt_vertex_count = 4 * RESOLUTION;
    let base_index_count = nb_subdivisions * nb_subdivisions * 2 * 3;
    let skirt_index_count = 4 * nb_subdivisions * 2 * 3;

    let mut positions = vec![0.0; (base_vertex_count + skirt_vertex_count) * 3];
    let mut normals = vec![0.0; (base_vertex_count + skirt_vertex_count) * 3];
    let mut indices = vec![0; base_index_count + skirt_index_count];
    let mut scattered_points_buffer = Vec::new();

    build_chunk_vertex_data(
        &build_data,
        &mut positions,
        &mut indices,
        &mut normals,
        &mut scattered_points_buffer,
        0.0,
    );

    let border_loops = build_border_loops();
    let skirt_loops: [Vec<usize>; 4] = std::array::from_fn(|loop_index| {
        let start = base_vertex_count + loop_index * RESOLUTION;
        (start..start + RESOLUTION).collect()
    });

    let mut next_index_offset = base_index_count;
    for (loop_index, (border_loop, skirt_loop)) in
        border_loops.iter().zip(skirt_loops.iter()).enumerate()
    {
        for i in 0..nb_subdivisions {
            let inner_vertex_index = match loop_index {
                0 => get_grid_index(1, i),
                1 => get_grid_index(i, RESOLUTION - 2),
                2 => get_grid_index(RESOLUTION - 2, RESOLUTION - 1 - i),
                3 => get_grid_index(RESOLUTION - 1 - i, 1),
                _ => unreachable!(),
            };

            let top_a = get_vertex(&positions, border_loop[i]);
            let top_b = get_vertex(&positions, border_loop[i + 1]);
            let bottom_a = get_vertex(&positions, skirt_loop[i]);
            let bottom_b = get_vertex(&positions, skirt_loop[i + 1]);
            let inner_vertex = get_vertex(&positions, inner_vertex_index);
            let quad_centroid = (&(&(&top_a + &top_b) + &bottom_a) + &bottom_b) / 4.0;
            let outward_reference = &quad_centroid - &inner_vertex;

            for triangle in indices[next_index_offset..next_index_offset + 6].chunks_exact(3) {
                let p1 = get_vertex(&positions, triangle[0] as usize);
                let p2 = get_vertex(&positions, triangle[1] as usize);
                let p3 = get_vertex(&positions, triangle[2] as usize);
                let normal = Vector3::cross(&(&p2 - &p1), &(&p3 - &p1));

                assert!(
                    Vector3::dot(&normal, &outward_reference) < 0.0,
                    "Skirt triangle winding should face toward chunk interior: {:?}",
                    triangle
                );
            }

            next_index_offset += 6;
        }
    }
}
