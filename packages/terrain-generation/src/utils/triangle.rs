use crate::utils::matrix4::Matrix4;
use crate::utils::quaternion::Quaternion;
use crate::utils::random::random01;
use crate::utils::vector3::Vector3;

pub fn triangle_area(
    x1: f32,
    y1: f32,
    z1: f32,
    x2: f32,
    y2: f32,
    z2: f32,
    x3: f32,
    y3: f32,
    z3: f32,
) -> f32 {
    // use cross product to calculate area of triangle
    let ux = x2 - x1;
    let uy = y2 - y1;
    let uz = z2 - z1;

    let vx = x3 - x1;
    let vy = y3 - y1;
    let vz = z3 - z1;

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;

    f32::sqrt(nx * nx + ny * ny + nz * nz) / 2.0
}

pub fn triangle_area_from_buffer(
    positions: &[f32],
    index1: usize,
    index2: usize,
    index3: usize,
) -> f32 {
    triangle_area(
        positions[3 * index1],
        positions[3 * index1 + 1],
        positions[3 * index1 + 2],
        positions[3 * index2],
        positions[3 * index2 + 1],
        positions[3 * index2 + 2],
        positions[3 * index3],
        positions[3 * index3 + 1],
        positions[3 * index3 + 2],
    )
}

pub fn random_point_in_triangle_from_buffer(
    positions: &[f32],
    normals: &[f32],
    index1: usize,
    index2: usize,
    index3: usize,
) -> [f32; 6] {
    let r1 = random01();
    let r2 = random01();

    let x1 = positions[3 * index1];
    let y1 = positions[3 * index1 + 1];
    let z1 = positions[3 * index1 + 2];

    let x2 = positions[3 * index2];
    let y2 = positions[3 * index2 + 1];
    let z2 = positions[3 * index2 + 2];

    let x3 = positions[3 * index3];
    let y3 = positions[3 * index3 + 1];
    let z3 = positions[3 * index3 + 2];

    let n1x = normals[3 * index1];
    let n1y = normals[3 * index1 + 1];
    let n1z = normals[3 * index1 + 2];

    let n2x = normals[3 * index2];
    let n2y = normals[3 * index2 + 1];
    let n2z = normals[3 * index2 + 2];

    let n3x = normals[3 * index3];
    let n3y = normals[3 * index3 + 1];
    let n3z = normals[3 * index3 + 2];

    let f1 = 1.0 - r1.sqrt();
    let f2 = r1.sqrt() * (1.0 - r2);
    let f3 = r1.sqrt() * r2;

    let x = f1 * x1 + f2 * x2 + f3 * x3;
    let y = f1 * y1 + f2 * y2 + f3 * y3;
    let z = f1 * z1 + f2 * z2 + f3 * z3;

    let nx = f1 * n1x + f2 * n2x + f3 * n3x;
    let ny = f1 * n1y + f2 * n2y + f3 * n3y;
    let nz = f1 * n1z + f2 * n2z + f3 * n3z;

    [x, y, z, nx, ny, nz]
}

pub fn scatter_in_triangle(
    chunk_position: &Vector3,
    scatter_per_square_meter: f32,
    excess_instance_number: &mut f32,
    instance_index: &mut usize,
    instances_matrix_buffer: &mut [f32],
    aligned_instances_matrix_buffer: &mut [f32],
    positions: &[f32],
    normals: &[f32],
    local_vertical_direction: &Vector3,
    index1: usize,
    index2: usize,
    index3: usize,
) {
    let triangle_area = triangle_area_from_buffer(positions, index1, index2, index3);
    let nb_instances =
        f32::floor(triangle_area * scatter_per_square_meter + *excess_instance_number) as u32;

    *excess_instance_number =
        triangle_area * scatter_per_square_meter + *excess_instance_number - nb_instances as f32;

    for _ in 0..nb_instances {
        let [x, y, z, nx, ny, nz] =
            random_point_in_triangle_from_buffer(positions, normals, index1, index2, index3);

        let align_quaternion =
            Quaternion::get_transformation(&Vector3::up(), &Vector3::new(nx, ny, nz));
        let vertical_quaternion =
            Quaternion::get_transformation(&Vector3::up(), local_vertical_direction);

        let scaling = 0.9 + random01() * 0.2;
        let scaling_vector = Vector3::new(scaling, scaling, scaling);

        let rotation_on_itself =
            Quaternion::rotation_axis(&Vector3::up(), random01() * 2.0 * std::f32::consts::PI);
        let position = &Vector3::new(x, y, z) + chunk_position;

        let aligned_matrix = Matrix4::compose(
            &scaling_vector,
            &(&align_quaternion * &rotation_on_itself),
            &position,
        );
        let matrix = Matrix4::compose(
            &scaling_vector,
            &(&vertical_quaternion * &rotation_on_itself),
            &position,
        );

        aligned_matrix.copy_to_array(aligned_instances_matrix_buffer, 16 * *instance_index);
        matrix.copy_to_array(instances_matrix_buffer, 16 * *instance_index);

        *instance_index += 1;
    }
}
