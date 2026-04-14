use terrain_generation::utils::triangle::scatter_in_triangle;
use terrain_generation::utils::vector3::Vector3;

fn assert_close(actual: f32, expected: f32) {
    assert!(
        (actual - expected).abs() < 1.0e-5,
        "expected {expected}, got {actual}"
    );
}

#[test]
fn instance_translations_are_chunk_relative() {
    let local_vertical_direction = Vector3::up();

    let positions = vec![
        0.0, 0.0, 0.0, //
        1.0, 0.0, 0.0, //
        0.0, 0.0, 1.0,
    ];
    let normals = vec![
        0.0, 1.0, 0.0, //
        0.0, 1.0, 0.0, //
        0.0, 1.0, 0.0,
    ];

    let mut excess_instance_number = 0.0;
    let mut instance_index = 0;
    let mut instances_matrix_buffer = vec![0.0; 16 * 8];
    let mut aligned_instances_matrix_buffer = vec![0.0; 16 * 8];

    scatter_in_triangle(
        10.0,
        &mut excess_instance_number,
        &mut instance_index,
        &mut instances_matrix_buffer,
        &mut aligned_instances_matrix_buffer,
        &positions,
        &normals,
        &local_vertical_direction,
        0,
        1,
        2,
    );

    assert!(instance_index > 0);

    assert_close(
        instances_matrix_buffer[12],
        aligned_instances_matrix_buffer[12],
    );
    assert_close(
        instances_matrix_buffer[13],
        aligned_instances_matrix_buffer[13],
    );
    assert_close(
        instances_matrix_buffer[14],
        aligned_instances_matrix_buffer[14],
    );
}
