use crate::utils::vector3::Vector3;

pub fn geographic_coordinates_to_cartesian(latitude: f64, longitude: f64) -> Vector3 {
    Vector3::new(
        (f64::cos(latitude) * f64::cos(longitude)) as f32,
        f64::sin(latitude) as f32,
        (f64::cos(latitude) * f64::sin(longitude)) as f32,
    )
}
