use float_eq::float_eq;
use terrain_generation::utils::matrix4::Matrix4;
use terrain_generation::utils::quaternion::Quaternion;
use terrain_generation::utils::vector3::Vector3;

#[test]
fn matrix4_compose() {
    let matrix = Matrix4::compose(
        &Vector3::new(1.0, 1.0, 1.0),
        &Quaternion::identity(),
        &Vector3::zero(),
    );

    assert_eq!(
        matrix.m,
        [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,]
    );

    let matrix2 = Matrix4::compose(
        &Vector3::new(0.2, 0.2, 0.2),
        &Quaternion::rotation_axis(&Vector3::new(0.0, 1.0, 0.0), std::f32::consts::PI),
        &Vector3::new(1.0, -1.0, 1.0),
    );

    float_eq!(
        matrix2.m,
        [
            -0.199_999_75,
            0.0,
            -0.000_318_530_6,
            0.0,
            0.0,
            0.2,
            0.0,
            0.0,
            0.000_318_530_6,
            0.0,
            -0.199_999_75,
            0.0,
            1.0,
            -1.0,
            1.0,
            1.0,
        ],
        abs_all <= 1e-6
    );

    let mut buffer = vec![0.0; 16];
    matrix2.copy_to_array(&mut buffer, 0);

    float_eq!(
        buffer,
        vec![
            -0.199_999_75,
            0.0,
            -0.000_318_530_6,
            0.0,
            0.0,
            0.2,
            0.0,
            0.0,
            0.000_318_530_6,
            0.0,
            -0.199_999_75,
            0.0,
            1.0,
            -1.0,
            1.0,
            1.0,
        ],
        abs_all <= 1e-6
    );
}
