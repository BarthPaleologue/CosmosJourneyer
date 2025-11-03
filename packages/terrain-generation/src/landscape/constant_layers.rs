use crate::utils::vector3::Vector3;

pub fn constant_layer(value: f32) -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    move |_: &Vector3, _: f32, _: &mut Vector3| value
}

pub fn zero_layer() -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    constant_layer(0.0)
}

pub fn one_layer() -> impl Fn(&Vector3, f32, &mut Vector3) -> f32 {
    constant_layer(1.0)
}
