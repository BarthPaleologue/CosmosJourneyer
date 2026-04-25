use terrain_generation::utils::triangle::scatter_in_triangle;

fn assert_close(actual: f32, expected: f32) {
    assert!(
        (actual - expected).abs() < 1.0e-5,
        "expected {expected}, got {actual}"
    );
}

#[test]
fn scattered_points_buffer_interleaves_positions_and_normals() {
    let positions = vec![
        0.0, 0.0, 0.0, //
        1.0, 0.0, 0.0, //
        0.0, 0.0, 1.0,
    ];

    let mut excess_instance_number = 0.0;
    let mut instance_index = 0;
    let mut scattered_points_buffer = vec![0.0; 6 * 8];

    scatter_in_triangle(
        10.0,
        &mut excess_instance_number,
        &mut instance_index,
        &mut scattered_points_buffer,
        &positions,
        0,
        1,
        2,
    );

    assert!(instance_index > 0);
    for i in 0..instance_index {
        let offset = 6 * i;
        let x = scattered_points_buffer[offset];
        let y = scattered_points_buffer[offset + 1];
        let z = scattered_points_buffer[offset + 2];
        let nx = scattered_points_buffer[offset + 3];
        let ny = scattered_points_buffer[offset + 4];
        let nz = scattered_points_buffer[offset + 5];

        assert!(x >= 0.0);
        assert!(z >= 0.0);
        assert!(x + z <= 1.0 + 1.0e-5);
        assert_close(y, 0.0);
        assert_close(nx, 0.0);
        assert_close(ny, 1.0);
        assert_close(nz, 0.0);
    }
}
