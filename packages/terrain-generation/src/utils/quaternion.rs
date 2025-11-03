use crate::utils::vector3::Vector3;
use std::ops;

pub struct Quaternion {
    pub(crate) x: f32,
    pub(crate) y: f32,
    pub(crate) z: f32,
    pub(crate) w: f32,
}

impl Quaternion {
    pub fn rotation_axis(axis: &Vector3, angle: f32) -> Quaternion {
        let sin = f32::sin(angle / 2.0);
        Quaternion {
            w: f32::cos(angle / 2.0),
            x: axis.x * sin,
            y: axis.y * sin,
            z: axis.z * sin,
        }
    }

    pub fn identity() -> Quaternion {
        Quaternion {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
        }
    }

    pub fn get_transformation(from: &Vector3, to: &Vector3) -> Self {
        let rotation_axis = Vector3::cross(from, to);
        let angle = f32::acos(Vector3::dot(from, to));
        Quaternion::rotation_axis(&rotation_axis, angle)
    }
}

impl ops::Mul<Quaternion> for Quaternion {
    type Output = Quaternion;

    fn mul(self, rhs: Quaternion) -> Self::Output {
        &self * &rhs
    }
}

impl ops::Mul<&Quaternion> for &Quaternion {
    type Output = Quaternion;

    fn mul(self, rhs: &Quaternion) -> Self::Output {
        Quaternion {
            w: self.w * rhs.w - self.x * rhs.x - self.y * rhs.y - self.z * rhs.z,
            x: self.w * rhs.x + self.x * rhs.w + self.y * rhs.z - self.z * rhs.y,
            y: self.w * rhs.y - self.x * rhs.z + self.y * rhs.w + self.z * rhs.x,
            z: self.w * rhs.z + self.x * rhs.y - self.y * rhs.x + self.z * rhs.w,
        }
    }
}
