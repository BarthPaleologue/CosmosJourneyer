use crate::utils::random::random01;

pub struct TriangleSurface {
    pub area: f32,
    pub normal: [f32; 3],
}

#[allow(clippy::too_many_arguments)]
pub fn triangle_surface(
    x1: f32,
    y1: f32,
    z1: f32,
    x2: f32,
    y2: f32,
    z2: f32,
    x3: f32,
    y3: f32,
    z3: f32,
) -> TriangleSurface {
    let ux = x2 - x1;
    let uy = y2 - y1;
    let uz = z2 - z1;

    let vx = x3 - x1;
    let vy = y3 - y1;
    let vz = z3 - z1;

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    let length = f32::sqrt(nx * nx + ny * ny + nz * nz);

    TriangleSurface {
        area: length / 2.0,
        normal: [nx / length, ny / length, nz / length],
    }
}

#[allow(clippy::too_many_arguments)]
pub fn random_point_in_triangle(
    x1: f32,
    y1: f32,
    z1: f32,
    x2: f32,
    y2: f32,
    z2: f32,
    x3: f32,
    y3: f32,
    z3: f32,
) -> [f32; 3] {
    let r1 = random01();
    let r2 = random01();

    let r1_sqrt = r1.sqrt();
    let f1 = 1.0 - r1_sqrt;
    let f2 = r1_sqrt * (1.0 - r2);
    let f3 = r1_sqrt * r2;

    let x = f1 * x1 + f2 * x2 + f3 * x3;
    let y = f1 * y1 + f2 * y2 + f3 * y3;
    let z = f1 * z1 + f2 * z2 + f3 * z3;

    [x, y, z]
}

#[allow(clippy::too_many_arguments)]
pub fn scatter_in_triangle(
    scatter_per_square_meter: f32,
    excess_instance_number: &mut f32,
    instance_index: &mut usize,
    scattered_points_buffer: &mut [f32],
    positions: &[f32],
    index1: usize,
    index2: usize,
    index3: usize,
) {
    let x1 = positions[3 * index1];
    let y1 = positions[3 * index1 + 1];
    let z1 = positions[3 * index1 + 2];

    let x2 = positions[3 * index2];
    let y2 = positions[3 * index2 + 1];
    let z2 = positions[3 * index2 + 2];

    let x3 = positions[3 * index3];
    let y3 = positions[3 * index3 + 1];
    let z3 = positions[3 * index3 + 2];

    let TriangleSurface { area, normal } = triangle_surface(x1, y1, z1, x2, y2, z2, x3, y3, z3);
    let nb_instances = f32::floor(area * scatter_per_square_meter + *excess_instance_number) as u32;

    *excess_instance_number =
        area * scatter_per_square_meter + *excess_instance_number - nb_instances as f32;

    let [nx, ny, nz] = normal;

    for _ in 0..nb_instances {
        let [x, y, z] = random_point_in_triangle(x1, y1, z1, x2, y2, z2, x3, y3, z3);
        let offset = 6 * *instance_index;
        scattered_points_buffer[offset] = x;
        scattered_points_buffer[offset + 1] = y;
        scattered_points_buffer[offset + 2] = z;
        scattered_points_buffer[offset + 3] = -nx;
        scattered_points_buffer[offset + 4] = -ny;
        scattered_points_buffer[offset + 5] = -nz;

        *instance_index += 1;
    }
}
