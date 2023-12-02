vec3 removeAxialTilt(vec3 tiltedVector, vec3 tiltedAxis) {
    vec3 targetAxis = vec3(0.0, 1.0, 0.0);
    vec3 rotationRemovalAxis = cross(tiltedAxis, targetAxis);
    return rotateAround(tiltedVector, rotationRemovalAxis, acos(dot(tiltedAxis, targetAxis)));
}