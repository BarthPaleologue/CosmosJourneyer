fn remap(value: f32, old_min: f32, old_max: f32, new_min: f32, new_max: f32) -> f32 {
    return new_min + (value - old_min) * (new_max - new_min) / (old_max - old_min);
}