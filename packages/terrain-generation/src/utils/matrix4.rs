use crate::utils::quaternion::Quaternion;
use crate::utils::vector3::Vector3;

pub struct Matrix4 {
    pub m: [f32; 16],
}

impl Matrix4 {
    pub fn compose(scaling: &Vector3, rotation: &Quaternion, position: &Vector3) -> Self {
        let x = rotation.x;
        let y = rotation.y;
        let z = rotation.z;
        let w = rotation.w;
        let x2 = x + x;
        let y2 = y + y;
        let z2 = z + z;
        let xx = x * x2;
        let xy = x * y2;
        let xz = x * z2;
        let yy = y * y2;
        let yz = y * z2;
        let zz = z * z2;
        let wx = w * x2;
        let wy = w * y2;
        let wz = w * z2;
        let sx = scaling.x;
        let sy = scaling.y;
        let sz = scaling.z;
        let mut m = [0.0; 16];
        m[0] = (1.0 - (yy + zz)) * sx;
        m[1] = (xy + wz) * sx;
        m[2] = (xz - wy) * sx;
        m[3] = 0.0;
        m[4] = (xy - wz) * sy;
        m[5] = (1.0 - (xx + zz)) * sy;
        m[6] = (yz + wx) * sy;
        m[7] = 0.0;
        m[8] = (xz + wy) * sz;
        m[9] = (yz - wx) * sz;
        m[10] = (1.0 - (xx + yy)) * sz;
        m[11] = 0.0;
        m[12] = position.x;
        m[13] = position.y;
        m[14] = position.z;
        m[15] = 1.0;
        Matrix4 { m }
    }

    pub fn copy_to_array(&self, array: &mut [f32], offset: usize) {
        array[offset..(16 + offset)].copy_from_slice(&self.m[..16]);
    }
}
