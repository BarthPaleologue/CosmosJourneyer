/* sdnoise1234, Simplex noise with true analytic
 * derivative in 1D to 4D.
 *
 * Copyright � 2003-2012, Stefan Gustavson
 *
 * Contact: stefan.gustavson@gmail.com
 *
 * This library is public domain software, released by the author
 * into the public domain in February 2011. You may do anything
 * you like with it. You may even remove all attributions,
 * but of course I'd appreciate it if you kept my name somewhere.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 */

/*
 * This is an implementation of Perlin "SIMPLEX noise" over one
 * dimension (x), two dimensions (x,y), three dimensions (x,y,z)
 * and four dimensions (x,y,z,w). The analytic derivative is
 * returned, to make it possible to do lots of fun stuff like
 * flow animations, curl noise, analytic antialiasing and such.
 *
 * Visually, this noise is exactly the same as the plain version of
 * SIMPLEX noise provided in the file "snoise1234.c". It just returns
 * all partial derivatives in addition to the scalar noise value.
 *
 * 2012-01-12: Slight update to compile with MSVC (declarations moved).
 * 2021: Ported to Typescript by Barthélemy Paléologue
 * 2022: Ported to Rust by Barthélemy Paléologue
 */

use crate::utils::vector3::Vector3;

fn fast_floor(x: f32) -> f32 {
    if f32::floor(x) <= x {
        f32::floor(x)
    } else {
        f32::floor(x) - 1.0
    }
}

/* Static data ---------------------- */

/*
 * Permutation table. This is just a random jumble of all numbers 0-255,
 * repeated twice to avoid wrapping the index at 255 for each lookup.
 */
const PERM: [usize; 512] = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
    142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
    203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
    220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
    132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173,
    186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
    59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163,
    70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
    178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162,
    241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204,
    176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141,
    128, 195, 78, 66, 215, 61, 156, 180, 151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194,
    233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
    75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174,
    20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83,
    111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
    63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188,
    159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147,
    118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170,
    213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253,
    19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193,
    238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
    181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

/*
 * Gradient tables. These could be programmed the Ken Perlin way with
 * some clever bit-twiddling, but this is more clear, and not really slower.
 */
#[allow(dead_code)]
const GRAD3LUT: [[f32; 3]; 16] = [
    [1.0, 0.0, 1.0],
    [0.0, 1.0, 1.0], // 12 cube edges
    [-1.0, 0.0, 1.0],
    [0.0, -1.0, 1.0],
    [1.0, 0.0, -1.0],
    [0.0, 1.0, -1.0],
    [-1.0, 0.0, -1.0],
    [0.0, -1.0, -1.0],
    [1.0, -1.0, 0.0],
    [1.0, 1.0, 0.0],
    [-1.0, 1.0, 0.0],
    [-1.0, -1.0, 0.0],
    [1.0, 0.0, 1.0],
    [-1.0, 0.0, 1.0], // 4 repeats to make 16
    [0.0, 1.0, -1.0],
    [0.0, -1.0, -1.0],
];
const GRAD4LUT: [[f32; 4]; 32] = [
    [0.0, 1.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, -1.0],
    [0.0, 1.0, -1.0, 1.0],
    [0.0, 1.0, -1.0, -1.0], // 32 tesseract edges
    [0.0, -1.0, 1.0, 1.0],
    [0.0, -1.0, 1.0, -1.0],
    [0.0, -1.0, -1.0, 1.0],
    [0.0, -1.0, -1.0, -1.0],
    [1.0, 0.0, 1.0, 1.0],
    [1.0, 0.0, 1.0, -1.0],
    [1.0, 0.0, -1.0, 1.0],
    [1.0, 0.0, -1.0, -1.0],
    [-1.0, 0.0, 1.0, 1.0],
    [-1.0, 0.0, 1.0, -1.0],
    [-1.0, 0.0, -1.0, 1.0],
    [-1.0, 0.0, -1.0, -1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, -1.0],
    [1.0, -1.0, 0.0, 1.0],
    [1.0, -1.0, 0.0, -1.0],
    [-1.0, 1.0, 0.0, 1.0],
    [-1.0, 1.0, 0.0, -1.0],
    [-1.0, -1.0, 0.0, 1.0],
    [-1.0, -1.0, 0.0, -1.0],
    [1.0, 1.0, 1.0, 0.0],
    [1.0, 1.0, -1.0, 0.0],
    [1.0, -1.0, 1.0, 0.0],
    [1.0, -1.0, -1.0, 0.0],
    [-1.0, 1.0, 1.0, 0.0],
    [-1.0, 1.0, -1.0, 0.0],
    [-1.0, -1.0, 1.0, 0.0],
    [-1.0, -1.0, -1.0, 0.0],
];

// A lookup table to traverse the SIMPLEX around a given point in 4D.
// Details can be found where this table is used, in the 4D noise method.
/* TODO: This should not be required, backport it from Bill's GLSL code! */
const SIMPLEX: [[i32; 4]; 64] = [
    [0, 1, 2, 3],
    [0, 1, 3, 2],
    [0, 0, 0, 0],
    [0, 2, 3, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 3, 0],
    [0, 2, 1, 3],
    [0, 0, 0, 0],
    [0, 3, 1, 2],
    [0, 3, 2, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 3, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 0, 3],
    [0, 0, 0, 0],
    [1, 3, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 3, 0, 1],
    [2, 3, 1, 0],
    [1, 0, 2, 3],
    [1, 0, 3, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 3, 1],
    [0, 0, 0, 0],
    [2, 1, 3, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 1, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 0, 1, 2],
    [3, 0, 2, 1],
    [0, 0, 0, 0],
    [3, 1, 2, 0],
    [2, 1, 0, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 1, 0, 2],
    [0, 0, 0, 0],
    [3, 2, 0, 1],
    [3, 2, 1, 0],
];

/* --------------------------------------------------------------------- */

/*
 * Helper functions to compute gradients in 1D to 4D
 * and gradients-dot-residualvectors in 2D to 4D.
 */
#[allow(dead_code)]
fn grad3(hash: usize) -> (f32, f32, f32) {
    let h = hash & 15;
    let gx = GRAD3LUT[h][0];
    let gy = GRAD3LUT[h][1];
    let gz = GRAD3LUT[h][2];
    (gx, gy, gz)
}

fn grad4(hash: usize) -> (f32, f32, f32, f32) {
    let h = hash & 31;
    let gx = GRAD4LUT[h][0];
    let gy = GRAD4LUT[h][1];
    let gz = GRAD4LUT[h][2];
    let gw = GRAD4LUT[h][3];
    (gx, gy, gz, gw)
}

/* Skewing factors for 3D simplex grid:
 * F3 = 1/3
 * G3 = 1/6 */
#[allow(dead_code)]
static F3: f32 = 0.333_333_34;
#[allow(dead_code)]
static G3: f32 = 0.166_666_67;

/** 3D simplex noise with derivatives.
* If the last tthree arguments are not null, the analytic derivative
* (the 3D gradient of the scalar noise field) is also calculated.
 */
#[allow(dead_code)]
fn sdnoise3(x: f32, y: f32, z: f32, gradient: &mut Vector3) -> f32 {
    let (mut n0, mut n1, mut n2, mut n3) = (0.0, 0.0, 0.0, 0.0); /* Noise contributions from the four simplex corners */

    let (mut gx0, mut gy0, mut gz0, mut gx1, mut gy1, mut gz1) = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0); /* Gradients at simplex corners */
    let (mut gx2, mut gy2, mut gz2, mut gx3, mut gy3, mut gz3) = (0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    let (mut t20, mut t40, mut t21, mut t41, mut t22, mut t42, mut t23, mut t43) =
        (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);

    /* Skew the input space to determine which simplex cell we're in */
    let s = (x + y + z) * F3; /* Very nice and simple skew factor for 3D */
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let i = fast_floor(xs) as u32;
    let j = fast_floor(ys) as u32;
    let k = fast_floor(zs) as u32;

    let t = (i + j + k) as f32 * G3;
    let x_origin = i as f32 - t; /* Unskew the cell origin back to (x,y,z) space */
    let y_origin = j as f32 - t;
    let z_origin = k as f32 - t;
    let x0 = x - x_origin; /* The x,y,z distances from the cell origin */
    let y0 = y - y_origin;
    let z0 = z - z_origin;

    /* For the 3D case, the simplex shape is a slightly irregular tetrahedron.
     * Determine which simplex we are in. */
    let (mut i1, mut j1, mut k1) = (0, 0, 0); /* Offsets for second corner of simplex in (i,j,k) coords */
    let (mut i2, mut j2, mut k2) = (0, 0, 0); /* Offsets for third corner of simplex in (i,j,k) coords */

    /* TODO: This code would benefit from a backport from the GLSL version! */
    if x0 >= y0 {
        if y0 >= z0 {
            i1 = 1;
            i2 = 1;
            j2 = 1;
        }
        /* X Y Z order */
        else if x0 >= z0 {
            i1 = 1;
            i2 = 1;
            k2 = 1;
        }
        /* X Z Y order */
        else {
            k1 = 1;
            i2 = 1;
            k2 = 1;
        } /* Z X Y order */
    } else {
        // x0<y0
        if y0 < z0 {
            k1 = 1;
            j2 = 1;
            k2 = 1;
        }
        /* Z Y X order */
        else if x0 < z0 {
            j1 = 1;
            j2 = 1;
            k2 = 1;
        }
        /* Y Z X order */
        else {
            j1 = 1;
            i2 = 1;
            j2 = 1;
        } /* Y X Z order */
    }

    /* A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
     * a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
     * a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
     * c = 1/6.   */

    let x1 = x0 - i1 as f32 + G3; /* Offsets for second corner in (x,y,z) coords */
    let y1 = y0 - j1 as f32 + G3;
    let z1 = z0 - k1 as f32 + G3;
    let x2 = x0 - i2 as f32 + 2.0 * G3; /* Offsets for third corner in (x,y,z) coords */
    let y2 = y0 - j2 as f32 + 2.0 * G3;
    let z2 = z0 - k2 as f32 + 2.0 * G3;
    let x3 = x0 - 1.0 + 3.0 * G3; /* Offsets for last corner in (x,y,z) coords */
    let y3 = y0 - 1.0 + 3.0 * G3;
    let z3 = z0 - 1.0 + 3.0 * G3;

    /* Wrap the integer indices at 256, to avoid indexing perm[] out of bounds */
    let ii = (i % 256) as usize;
    let jj = (j % 256) as usize;
    let kk = (k % 256) as usize;

    /* Calculate the contribution from the four corners */
    let mut t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if t0 >= 0.0 {
        (gx0, gy0, gz0) = grad3(PERM[ii + PERM[jj + PERM[kk]]]);
        t20 = t0 * t0;
        t40 = t20 * t20;
        n0 = t40 * (gx0 * x0 + gy0 * y0 + gz0 * z0);
    } else {
        t0 = 0.0;
    }

    let mut t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if t1 < 0.0 {
        t1 = 0.0;
    } else {
        (gx1, gy1, gz1) = grad3(PERM[ii + i1 + PERM[jj + j1 + PERM[kk + k1]]]);
        t21 = t1 * t1;
        t41 = t21 * t21;
        n1 = t41 * (gx1 * x1 + gy1 * y1 + gz1 * z1);
    }

    let mut t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if t2 < 0.0 {
        t2 = 0.0;
    } else {
        (gx2, gy2, gz2) = grad3(PERM[ii + i2 + PERM[jj + j2 + PERM[kk + k2]]]);
        t22 = t2 * t2;
        t42 = t22 * t22;
        n2 = t42 * (gx2 * x2 + gy2 * y2 + gz2 * z2);
    }

    let mut t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if t3 < 0.0 {
        t3 = 0.0;
    } else {
        (gx3, gy3, gz3) = grad3(PERM[ii + 1 + PERM[jj + 1 + PERM[kk + 1]]] as usize);
        t23 = t3 * t3;
        t43 = t23 * t23;
        n3 = t43 * (gx3 * x3 + gy3 * y3 + gz3 * z3);
    }

    /*  Add contributions from each corner to get the final noise value.
     * The result is scaled to return values in the range [-1,1] */
    let noise = 28.0 * (n0 + n1 + n2 + n3);

    /* Compute derivative, if requested by supplying non-null pointers
     * for the last three arguments */
    //if ((NULL != dnoise_dx) && (NULL != dnoise_dy) && (NULL != dnoise_dz)) {
    /*  A straight, unoptimised calculation would be like:
     *     *dnoise_dx = -8.0f * t20 * t0 * x0 * dot(gx0, gy0, gz0, x0, y0, z0) + t40 * gx0;
     *    *dnoise_dy = -8.0f * t20 * t0 * y0 * dot(gx0, gy0, gz0, x0, y0, z0) + t40 * gy0;
     *    *dnoise_dz = -8.0f * t20 * t0 * z0 * dot(gx0, gy0, gz0, x0, y0, z0) + t40 * gz0;
     *    *dnoise_dx += -8.0f * t21 * t1 * x1 * dot(gx1, gy1, gz1, x1, y1, z1) + t41 * gx1;
     *    *dnoise_dy += -8.0f * t21 * t1 * y1 * dot(gx1, gy1, gz1, x1, y1, z1) + t41 * gy1;
     *    *dnoise_dz += -8.0f * t21 * t1 * z1 * dot(gx1, gy1, gz1, x1, y1, z1) + t41 * gz1;
     *    *dnoise_dx += -8.0f * t22 * t2 * x2 * dot(gx2, gy2, gz2, x2, y2, z2) + t42 * gx2;
     *    *dnoise_dy += -8.0f * t22 * t2 * y2 * dot(gx2, gy2, gz2, x2, y2, z2) + t42 * gy2;
     *    *dnoise_dz += -8.0f * t22 * t2 * z2 * dot(gx2, gy2, gz2, x2, y2, z2) + t42 * gz2;
     *    *dnoise_dx += -8.0f * t23 * t3 * x3 * dot(gx3, gy3, gz3, x3, y3, z3) + t43 * gx3;
     *    *dnoise_dy += -8.0f * t23 * t3 * y3 * dot(gx3, gy3, gz3, x3, y3, z3) + t43 * gy3;
     *    *dnoise_dz += -8.0f * t23 * t3 * z3 * dot(gx3, gy3, gz3, x3, y3, z3) + t43 * gz3;
     */
    let temp0 = t20 * t0 * (gx0 * x0 + gy0 * y0 + gz0 * z0);
    let mut dnoise_dx = temp0 * x0;
    let mut dnoise_dy = temp0 * y0;
    let mut dnoise_dz = temp0 * z0;
    let temp1 = t21 * t1 * (gx1 * x1 + gy1 * y1 + gz1 * z1);
    dnoise_dx += temp1 * x1;
    dnoise_dy += temp1 * y1;
    dnoise_dz += temp1 * z1;
    let temp2 = t22 * t2 * (gx2 * x2 + gy2 * y2 + gz2 * z2);
    dnoise_dx += temp2 * x2;
    dnoise_dy += temp2 * y2;
    dnoise_dz += temp2 * z2;
    let temp3 = t23 * t3 * (gx3 * x3 + gy3 * y3 + gz3 * z3);
    dnoise_dx += temp3 * x3;
    dnoise_dy += temp3 * y3;
    dnoise_dz += temp3 * z3;
    dnoise_dx *= -8.0;
    dnoise_dy *= -8.0;
    dnoise_dz *= -8.0;
    dnoise_dx += t40 * gx0 + t41 * gx1 + t42 * gx2 + t43 * gx3;
    dnoise_dy += t40 * gy0 + t41 * gy1 + t42 * gy2 + t43 * gy3;
    dnoise_dz += t40 * gz0 + t41 * gz1 + t42 * gz2 + t43 * gz3;
    dnoise_dx *= 28.0; /* Scale derivative to match the noise scaling */
    dnoise_dy *= 28.0;
    dnoise_dz *= 28.0;
    //}

    gradient.x = dnoise_dx;
    gradient.y = dnoise_dy;
    gradient.z = dnoise_dz;

    noise
}

// The skewing and unskewing factors are hairy again for the 4D case
const F4: f32 = 0.309_016_97;
// F4 = (Math.sqrt(5.0)-1.0)/4.0
const G4: f32 = 0.138_196_6; // G4 = (5.0-Math.sqrt(5.0))/20.0

#[derive(Clone, Copy)]
struct CornerContribution {
    n: f32,
    gx: f32,
    gy: f32,
    gz: f32,
    t: f32,
    t2: f32,
    t4: f32,
    grad_dot: f32,
}

impl CornerContribution {
    fn zero() -> Self {
        Self {
            n: 0.0,
            gx: 0.0,
            gy: 0.0,
            gz: 0.0,
            t: 0.0,
            t2: 0.0,
            t4: 0.0,
            grad_dot: 0.0,
        }
    }
}

#[allow(clippy::too_many_arguments)]
fn gradient_index(
    ii: usize,
    i_offset: usize,
    jj: usize,
    j_offset: usize,
    kk: usize,
    k_offset: usize,
    ll: usize,
    l_offset: usize,
) -> usize {
    let i_idx = ii + i_offset;
    let j_idx = jj + j_offset;
    let k_idx = kk + k_offset;
    let l_idx = ll + l_offset;

    PERM[i_idx + PERM[j_idx + PERM[k_idx + PERM[l_idx]]]]
}

fn corner_contribution(
    t: f32,
    perm_index: usize,
    x: f32,
    y: f32,
    z: f32,
    w: f32,
) -> CornerContribution {
    if t < 0.0 {
        CornerContribution::zero()
    } else {
        let t2 = t * t;
        let t4 = t2 * t2;
        let (gx, gy, gz, gw) = grad4(perm_index);
        let grad_dot = gx * x + gy * y + gz * z + gw * w;
        let n = t4 * grad_dot;
        CornerContribution {
            n,
            gx,
            gy,
            gz,
            t,
            t2,
            t4,
            grad_dot,
        }
    }
}

/** 4D SIMPLEX noise with derivatives.
* If the last four arguments are not null, the analytic derivative
* (the 4D gradient of the scalar noise field) is also calculated.
 */
fn sdnoise4(x: f32, y: f32, z: f32, w: f32, gradient: &mut Vector3) -> f32 {
    // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
    let s = (x + y + z + w) * F4; // Factor for 4D skewing
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let ws = w + s;

    let i = fast_floor(xs);
    let j = fast_floor(ys);
    let k = fast_floor(zs);
    let l = fast_floor(ws);

    let t = (i + j + k + l) * G4; // Factor for 4D unskewing
    let x_origin = i - t; // Unskew the cell origin back to (x,y,z,w) space
    let y_origin = j - t;
    let z_origin = k - t;
    let w_origin = l - t;

    let x0 = x - x_origin; // The x,y,z,w distances from the cell origin
    let y0 = y - y_origin;
    let z0 = z - z_origin;
    let w0 = w - w_origin;

    // For the 4D case, the SIMPLEX is a 4D shape I won't even try to describe.
    // To find out which of the 24 possible simplices we're in, we need to
    // determine the magnitude ordering of x0, y0, z0 and w0.
    // The method below is a reasonable way of finding the ordering of x,y,z,w
    // and then find the correct traversal order for the SIMPLEX we're in.
    // First, six pair-wise comparisons are performed between each possible pair
    // of the four coordinates, and then the results are used to add up binary
    // bits for an integer index into a precomputed lookup table, SIMPLEX[].
    let c1 = if x0 > y0 { 32.0 } else { 0.0 };
    let c2 = if x0 > z0 { 16.0 } else { 0.0 };
    let c3 = if y0 > z0 { 8.0 } else { 0.0 };
    let c4 = if x0 > w0 { 4.0 } else { 0.0 };
    let c5 = if y0 > w0 { 2.0 } else { 0.0 };
    let c6 = if z0 > w0 { 1.0 } else { 0.0 };
    let c = (c1 as i32 | c2 as i32 | c3 as i32 | c4 as i32 | c5 as i32 | c6 as i32) as usize; // '|' is mostly faster than '+'

    // SIMPLEX[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // The number 3 in the "SIMPLEX" array is at the position of the largest coordinate.
    let i1 = if SIMPLEX[c][0] >= 3 { 1.0 } else { 0.0 };
    let j1 = if SIMPLEX[c][1] >= 3 { 1.0 } else { 0.0 };
    let k1 = if SIMPLEX[c][2] >= 3 { 1.0 } else { 0.0 };
    let l1 = if SIMPLEX[c][3] >= 3 { 1.0 } else { 0.0 };
    // The number 2 in the "SIMPLEX" array is at the second largest coordinate.
    let i2 = if SIMPLEX[c][0] >= 2 { 1.0 } else { 0.0 };
    let j2 = if SIMPLEX[c][1] >= 2 { 1.0 } else { 0.0 };
    let k2 = if SIMPLEX[c][2] >= 2 { 1.0 } else { 0.0 };
    let l2 = if SIMPLEX[c][3] >= 2 { 1.0 } else { 0.0 };
    // The number 1 in the "SIMPLEX" array is at the second smallest coordinate.
    let i3 = if SIMPLEX[c][0] >= 1 { 1.0 } else { 0.0 };
    let j3 = if SIMPLEX[c][1] >= 1 { 1.0 } else { 0.0 };
    let k3 = if SIMPLEX[c][2] >= 1 { 1.0 } else { 0.0 };
    let l3 = if SIMPLEX[c][3] >= 1 { 1.0 } else { 0.0 };
    // The fifth corner has all coordinate offsets = 1, so no need to look that up.

    let x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
    let y1 = y0 - j1 + G4;
    let z1 = z0 - k1 + G4;
    let w1 = w0 - l1 + G4;
    let x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
    let y2 = y0 - j2 + 2.0 * G4;
    let z2 = z0 - k2 + 2.0 * G4;
    let w2 = w0 - l2 + 2.0 * G4;
    let x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
    let y3 = y0 - j3 + 3.0 * G4;
    let z3 = z0 - k3 + 3.0 * G4;
    let w3 = w0 - l3 + 3.0 * G4;
    let x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
    let y4 = y0 - 1.0 + 4.0 * G4;
    let z4 = z0 - 1.0 + 4.0 * G4;
    let w4 = w0 - 1.0 + 4.0 * G4;

    // Wrap the integer indices at 256, to avoid indexing PERM[] out of bounds
    let ii = (i as i32 & 0xff) as usize;
    let jj = (j as i32 & 0xff) as usize;
    let kk = (k as i32 & 0xff) as usize;
    let ll = (l as i32 & 0xff) as usize;

    let i1_usize = i1 as usize;
    let j1_usize = j1 as usize;
    let k1_usize = k1 as usize;
    let l1_usize = l1 as usize;
    let i2_usize = i2 as usize;
    let j2_usize = j2 as usize;
    let k2_usize = k2 as usize;
    let l2_usize = l2 as usize;
    let i3_usize = i3 as usize;
    let j3_usize = j3 as usize;
    let k3_usize = k3 as usize;
    let l3_usize = l3 as usize;

    let corner0 = corner_contribution(
        0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0,
        gradient_index(ii, 0, jj, 0, kk, 0, ll, 0),
        x0,
        y0,
        z0,
        w0,
    );
    let corner1 = corner_contribution(
        0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1,
        gradient_index(ii, i1_usize, jj, j1_usize, kk, k1_usize, ll, l1_usize),
        x1,
        y1,
        z1,
        w1,
    );
    let corner2 = corner_contribution(
        0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2,
        gradient_index(ii, i2_usize, jj, j2_usize, kk, k2_usize, ll, l2_usize),
        x2,
        y2,
        z2,
        w2,
    );
    let corner3 = corner_contribution(
        0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3,
        gradient_index(ii, i3_usize, jj, j3_usize, kk, k3_usize, ll, l3_usize),
        x3,
        y3,
        z3,
        w3,
    );
    let corner4 = corner_contribution(
        0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4,
        gradient_index(ii, 1, jj, 1, kk, 1, ll, 1),
        x4,
        y4,
        z4,
        w4,
    );

    // Sum up and scale the result to cover the range [-1,1]
    let noise = 27.0 * (corner0.n + corner1.n + corner2.n + corner3.n + corner4.n);

    let mut dnoise_dx = 0.0;
    let mut dnoise_dy = 0.0;
    let mut dnoise_dz = 0.0;

    for (corner, x_comp, y_comp, z_comp) in [
        (corner0, x0, y0, z0),
        (corner1, x1, y1, z1),
        (corner2, x2, y2, z2),
        (corner3, x3, y3, z3),
        (corner4, x4, y4, z4),
    ] {
        let temp = corner.t2 * corner.t * corner.grad_dot;
        dnoise_dx += temp * x_comp;
        dnoise_dy += temp * y_comp;
        dnoise_dz += temp * z_comp;
    }

    dnoise_dx *= -8.0;
    dnoise_dy *= -8.0;
    dnoise_dz *= -8.0;

    for corner in [corner0, corner1, corner2, corner3, corner4] {
        dnoise_dx += corner.t4 * corner.gx;
        dnoise_dy += corner.t4 * corner.gy;
        dnoise_dz += corner.t4 * corner.gz;
    }

    let magic_factor = 40.0;
    dnoise_dx *= magic_factor;
    dnoise_dy *= magic_factor;
    dnoise_dz *= magic_factor;

    gradient.x = dnoise_dx;
    gradient.y = dnoise_dy;
    gradient.z = dnoise_dz;

    noise
}

/**
 * Returns a random value in [0,1] based on SIMPLEX noise and computes the gradient if specified
 * @param vector the position to sample the noise at
 * @param gradient the recipient for the gradient (will be overridden)
 * @param seed an offset along the 4th dimension
 */
pub fn simplex401(vector: &Vector3, seed: f32, gradient: &mut Vector3) -> f32 {
    let noise_value = sdnoise4(vector.x, vector.y, vector.z, seed, gradient);
    // [0,1] is half the length of [-1,1]
    *gradient /= 2.0;

    (noise_value + 1.0) / 2.0
}

/**
 * Returns a random value in [-1,1] based on SIMPLEX noise and computes the gradient if specified
 * @param vector the position to sample the noise at
 * @param gradient the recipient for the gradient (will be overridden)
 * @param seed an offset along the 4th dimension
 */
pub fn simplex411(vector: &Vector3, seed: f32, gradient: &mut Vector3) -> f32 {
    sdnoise4(vector.x, vector.y, vector.z, seed, gradient)
}
