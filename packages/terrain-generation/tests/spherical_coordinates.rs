use std::f64::consts::{FRAC_PI_2, PI};

use terrain_generation::utils::spherical_coordinates::geographic_coordinates_to_cartesian;
use terrain_generation::utils::vector3::Vector3;

fn assert_coordinates(actual: Vector3, expected: [f32; 3]) {
    const EPSILON: f32 = 1e-6;

    assert!((actual.x - expected[0]).abs() < EPSILON);
    assert!((actual.y - expected[1]).abs() < EPSILON);
    assert!((actual.z - expected[2]).abs() < EPSILON);
}

#[test]
fn converts_geographic_coordinates_to_cartesian_coordinates() {
    assert_coordinates(
        geographic_coordinates_to_cartesian(0.0, 0.0),
        [1.0, 0.0, 0.0],
    );
    assert_coordinates(
        geographic_coordinates_to_cartesian(0.0, FRAC_PI_2),
        [0.0, 0.0, 1.0],
    );
    assert_coordinates(
        geographic_coordinates_to_cartesian(FRAC_PI_2, PI),
        [0.0, 1.0, 0.0],
    );
}
