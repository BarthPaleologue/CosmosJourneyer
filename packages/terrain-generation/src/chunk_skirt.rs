use crate::utils::vector3::Vector3;

fn get_grid_index(row: usize, column: usize, nb_vertices_per_row: usize) -> usize {
    row * nb_vertices_per_row + column
}

fn build_border_loops(nb_vertices_per_row: usize) -> [Vec<usize>; 4] {
    let mut top = Vec::with_capacity(nb_vertices_per_row);
    let mut right = Vec::with_capacity(nb_vertices_per_row);
    let mut bottom = Vec::with_capacity(nb_vertices_per_row);
    let mut left = Vec::with_capacity(nb_vertices_per_row);

    for i in 0..nb_vertices_per_row {
        top.push(get_grid_index(0, i, nb_vertices_per_row));
        right.push(get_grid_index(
            i,
            nb_vertices_per_row - 1,
            nb_vertices_per_row,
        ));
        bottom.push(get_grid_index(
            nb_vertices_per_row - 1,
            i,
            nb_vertices_per_row,
        ));
        left.push(get_grid_index(i, 0, nb_vertices_per_row));
    }

    [top, right, bottom, left]
}

fn get_vertex(positions: &[f32], index: usize) -> Vector3 {
    Vector3::new(
        positions[3 * index],
        positions[3 * index + 1],
        positions[3 * index + 2],
    )
}

fn triangle_normal(positions: &[f32], index1: usize, index2: usize, index3: usize) -> Vector3 {
    let p1 = get_vertex(positions, index1);
    let p2 = get_vertex(positions, index2);
    let p3 = get_vertex(positions, index3);

    Vector3::cross(&(&p2 - &p1), &(&p3 - &p1))
}

fn append_quad(
    indices: &mut [u16],
    next_index_offset: &mut usize,
    positions: &[f32],
    top_a: usize,
    top_b: usize,
    bottom_a: usize,
    bottom_b: usize,
) {
    let first_triangle_normal = triangle_normal(positions, top_a, bottom_a, top_b);
    let outward_reference = get_vertex(positions, top_a)
        + get_vertex(positions, top_b)
        + get_vertex(positions, bottom_a)
        + get_vertex(positions, bottom_b);

    let quad_indices = if Vector3::dot(&first_triangle_normal, &outward_reference) > 0.0 {
        [
            top_a as u16,
            top_b as u16,
            bottom_a as u16,
            top_b as u16,
            bottom_b as u16,
            bottom_a as u16,
        ]
    } else {
        [
            top_a as u16,
            bottom_a as u16,
            top_b as u16,
            top_b as u16,
            bottom_a as u16,
            bottom_b as u16,
        ]
    };

    indices[*next_index_offset..*next_index_offset + quad_indices.len()]
        .copy_from_slice(&quad_indices);
    *next_index_offset += quad_indices.len();
}

pub fn append_chunk_skirt(
    positions: &mut [f32],
    normals: &mut [f32],
    indices: &mut [u16],
    nb_vertices_per_row: usize,
    chunk_sphere_position: &Vector3,
    skirt_depth: f32,
) {
    let border_loops = build_border_loops(nb_vertices_per_row);
    let base_vertex_count = nb_vertices_per_row * nb_vertices_per_row;
    let duplicated_vertex_count = border_loops.len() * nb_vertices_per_row;
    let expected_vertex_count = base_vertex_count + duplicated_vertex_count;
    let expected_index_count = (nb_vertices_per_row - 1) * (nb_vertices_per_row - 1) * 2 * 3
        + border_loops.len() * (nb_vertices_per_row - 1) * 6;

    assert_eq!(positions.len(), expected_vertex_count * 3);
    assert_eq!(normals.len(), expected_vertex_count * 3);
    assert_eq!(indices.len(), expected_index_count);

    let mut next_vertex_index = base_vertex_count;
    let mut skirt_loops: [Vec<usize>; 4] =
        std::array::from_fn(|_| Vec::with_capacity(nb_vertices_per_row));

    for (loop_index, border_loop) in border_loops.iter().enumerate() {
        for &border_vertex_index in border_loop {
            let source_position = get_vertex(positions, border_vertex_index);
            let source_normal = get_vertex(normals, border_vertex_index);
            let source_planet_position = chunk_sphere_position + &source_position;
            let inward_direction = source_planet_position.normalize_to_new();
            let skirt_position = (source_planet_position - inward_direction * skirt_depth)
                - chunk_sphere_position.clone();

            positions[3 * next_vertex_index] = skirt_position.x;
            positions[3 * next_vertex_index + 1] = skirt_position.y;
            positions[3 * next_vertex_index + 2] = skirt_position.z;

            normals[3 * next_vertex_index] = source_normal.x;
            normals[3 * next_vertex_index + 1] = source_normal.y;
            normals[3 * next_vertex_index + 2] = source_normal.z;

            skirt_loops[loop_index].push(next_vertex_index);
            next_vertex_index += 1;
        }
    }

    let mut next_index_offset = (nb_vertices_per_row - 1) * (nb_vertices_per_row - 1) * 2 * 3;
    for (border_loop, skirt_loop) in border_loops.iter().zip(skirt_loops.iter()) {
        for i in 0..border_loop.len() - 1 {
            append_quad(
                indices,
                &mut next_index_offset,
                positions,
                border_loop[i],
                border_loop[i + 1],
                skirt_loop[i],
                skirt_loop[i + 1],
            );
        }
    }
}
