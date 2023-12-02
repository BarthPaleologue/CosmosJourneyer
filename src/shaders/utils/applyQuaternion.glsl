vec3 applyQuaternion(vec4 quaternion, vec3 vector) {
    float qx = quaternion.x;
    float qy = quaternion.y;
    float qz = quaternion.z;
    float qw = quaternion.w;
    float x = vector.x;
    float y = vector.y;
    float z = vector.z;
    // apply quaternion to vector
    float ix = qw * x + qy * z - qz * y;
    float iy = qw * y + qz * x - qx * z;
    float iz = qw * z + qx * y - qy * x;
    float iw = -qx * x - qy * y - qz * z;
    // calculate result * inverse quat
    float nX = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    float nY = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    float nZ = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return vec3(nX, nY, nZ);
}