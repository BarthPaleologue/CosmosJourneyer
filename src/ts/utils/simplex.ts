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
 * This is an implementation of Perlin "simplex noise" over one
 * dimension (x), two dimensions (x,y), three dimensions (x,y,z)
 * and four dimensions (x,y,z,w). The analytic derivative is
 * returned, to make it possible to do lots of fun stuff like
 * flow animations, curl noise, analytic antialiasing and such.
 *
 * Visually, this noise is exactly the same as the plain version of
 * simplex noise provided in the file "snoise1234.c". It just returns
 * all partial derivatives in addition to the scalar noise value.
 *
 * 2012-01-12: Slight update to compile with MSVC (declarations moved).
 */

import { LVector3 } from "./algebra";
import { IVector3Like } from "@babylonjs/core/Maths/math.like";

function FASTFLOOR(x: number): number {
    return x > 0 ? Math.trunc(x) : Math.trunc(x) - 1;
}

/* Static data ---------------------- */

/*
 * Permutation table. This is just a random jumble of all numbers 0-255,
 * repeated twice to avoid wrapping the index at 255 for each lookup.
 */
let perm = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62,
    94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111,
    229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
    28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115,
    121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180, 151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53,
    194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88,
    237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46,
    245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154,
    163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144,
    12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];

/*
 * Gradient tables. These could be programmed the Ken Perlin way with
 * some clever bit-twiddling, but this is more clear, and not really slower.
 */
let grad2lut = [
    [-1.0, -1.0],
    [1.0, 0.0],
    [-1.0, 0.0],
    [1.0, 1.0],
    [-1.0, 1.0],
    [0.0, -1.0],
    [0.0, 1.0],
    [1.0, -1.0]
];

/*
 * Gradient directions for 3D.
 * These vectors are based on the midpoints of the 12 edges of a cube.
 * A larger array of random unit length vectors would also do the job,
 * but these 12 (including 4 repeats to make the array length a power
 * of two) work better. They are not random, they are carefully chosen
 * to represent a small, isotropic set of directions.
 */

let grad3lut = [
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
    [0.0, -1.0, -1.0]
];

let grad4lut = [
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
    [-1.0, -1.0, -1.0, 0.0]
];

// A lookup table to traverse the simplex around a given point in 4D.
// Details can be found where this table is used, in the 4D noise method.
/* TODO: This should not be required, backport it from Bill's GLSL code! */
let simplex = [
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
    [3, 2, 1, 0]
];

/* --------------------------------------------------------------------- */

/*
 * Helper functions to compute gradients in 1D to 4D
 * and gradients-dot-residualvectors in 2D to 4D.
 */

function grad1(hash: number, gx: number): number {
    let h = hash & 15;
    let res = 1.0 + (h & 7); // Gradient value is one of 1.0, 2.0, ..., 8.0
    if (h & 8) res = -res; // Make half of the gradients negative
    return res;
}

function grad2(hash: number): [number, number] {
    let h = hash & 7;
    let gx = grad2lut[h][0];
    let gy = grad2lut[h][1];
    return [gx, gy];
}

function grad3(hash: number): [number, number, number] {
    let h = hash & 15;
    let gx = grad3lut[h][0];
    let gy = grad3lut[h][1];
    let gz = grad3lut[h][2];
    return [gx, gy, gz];
}

function grad4(hash: number): [number, number, number, number] {
    let h = hash & 31;
    let gx = grad4lut[h][0];
    let gy = grad4lut[h][1];
    let gz = grad4lut[h][2];
    let gw = grad4lut[h][3];
    return [gx, gy, gz, gw];
}

/** 1D simplex noise with derivative.
 * If the last argument is not null, the analytic derivative
 * is also calculated.
 */
export function sdnoise1(x: number): [number, number] {
    let i0 = FASTFLOOR(x);
    let i1 = i0 + 1;
    let x0 = x - i0;
    let x1 = x0 - 1.0;

    let gx0: number = 0;
    let gx1: number = 0;
    let n0, n1;
    let t1, t20, t40, t21, t41, x21;

    let x20 = x0 * x0;
    let t0 = 1.0 - x20;
    //  if(t0 < 0.0) t0 = 0.0; // Never happens for 1D: x0<=1 always
    t20 = t0 * t0;
    t40 = t20 * t20;
    gx0 = grad1(perm[i0 & 0xff], gx0);
    n0 = t40 * gx0 * x0;

    x21 = x1 * x1;
    t1 = 1.0 - x21;
    //  if(t1 < 0.0) t1 = 0.0; // Never happens for 1D: |x1|<=1 always
    t21 = t1 * t1;
    t41 = t21 * t21;
    gx1 = grad1(perm[i1 & 0xff], gx1);
    n1 = t41 * gx1 * x1;

    /* Compute derivative, if requested by supplying non-null pointer
     * for the last argument
     * Compute derivative according to:
     *  *dnoise_dx = -8.0f * t20 * t0 * x0 * (gx0 * x0) + t40 * gx0;
     *  *dnoise_dx += -8.0f * t21 * t1 * x1 * (gx1 * x1) + t41 * gx1;
     */

    let dnoise_dx = 0;

    dnoise_dx = t20 * t0 * gx0 * x20;
    dnoise_dx += t21 * t1 * gx1 * x21;
    dnoise_dx *= -8.0;
    dnoise_dx += t40 * gx0 + t41 * gx1;
    dnoise_dx *= 0.25; /* Scale derivative to match the noise scaling */

    // The maximum value of this noise is 8*(3/4)^4 = 2.53125
    // A factor of 0.395 would scale to fit exactly within [-1,1], but
    // to better match classic Perlin noise, we scale it down some more.
    return [0.25 * (n0 + n1), dnoise_dx];
}

/* Skewing factors for 2D simplex grid:
 * F2 = 0.5*(sqrt(3.0)-1.0)
 * G2 = (3.0-Math.sqrt(3.0))/6.0
 */
const F2 = 0.366025403;
const G2 = 0.211324865;

/** 2D simplex noise with derivatives.
 * If the last two arguments are not null, the analytic derivative
 * (the 2D gradient of the scalar noise field) is also calculated.
 */
export function sdnoise2(x: number, y: number): number[] {
    let n0, n1, n2; /* Noise contributions from the three simplex corners */
    let gx0, gy0, gx1, gy1, gx2, gy2; /* Gradients at simplex corners */
    let t0, t1, t2, x1, x2, y1, y2;
    let t20, t40, t21, t41, t22, t42;
    let temp0, temp1, temp2, noise;

    /* Skew the input space to determine which simplex cell we're in */
    let s = (x + y) * F2; /* Hairy factor for 2D */
    let xs = x + s;
    let ys = y + s;
    let ii,
        i = FASTFLOOR(xs);
    let jj,
        j = FASTFLOOR(ys);

    let t = (i + j) * G2;
    let X0 = i - t; /* Unskew the cell origin back to (x,y) space */
    let Y0 = j - t;
    let x0 = x - X0; /* The x,y distances from the cell origin */
    let y0 = y - Y0;

    /* For the 2D case, the simplex shape is an equilateral triangle.
     * Determine which simplex we are in. */
    let i1, j1; /* Offsets for second (middle) corner of simplex in (i,j) coords */
    if (x0 > y0) {
        i1 = 1;
        j1 = 0;
    } /* lower triangle, XY order: (0,0)->(1,0)->(1,1) */ else {
        i1 = 0;
        j1 = 1;
    } /* upper triangle, YX order: (0,0)->(0,1)->(1,1) */

    /* A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
     * a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
     * c = (3-sqrt(3))/6   */
    x1 = x0 - i1 + G2; /* Offsets for middle corner in (x,y) unskewed coords */
    y1 = y0 - j1 + G2;
    x2 = x0 - 1.0 + 2.0 * G2; /* Offsets for last corner in (x,y) unskewed coords */
    y2 = y0 - 1.0 + 2.0 * G2;

    /* Wrap the integer indices at 256, to avoid indexing perm[] out of bounds */
    ii = i % 256;
    jj = j % 256;

    /* Calculate the contribution from the three corners */
    t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0.0) t40 = t20 = t0 = n0 = gx0 = gy0 = 0.0; /* No influence */
    else {
        [gx0, gy0] = grad2(perm[ii + perm[jj]]);
        t20 = t0 * t0;
        t40 = t20 * t20;
        n0 = t40 * (gx0 * x0 + gy0 * y0);
    }

    t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0.0) t21 = t41 = t1 = n1 = gx1 = gy1 = 0.0; /* No influence */
    else {
        [gx1, gy1] = grad2(perm[ii + i1 + perm[jj + j1]]);
        t21 = t1 * t1;
        t41 = t21 * t21;
        n1 = t41 * (gx1 * x1 + gy1 * y1);
    }

    t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0.0) t42 = t22 = t2 = n2 = gx2 = gy2 = 0.0; /* No influence */
    else {
        [gx2, gy2] = grad2(perm[ii + 1 + perm[jj + 1]]);
        t22 = t2 * t2;
        t42 = t22 * t22;
        n2 = t42 * (gx2 * x2 + gy2 * y2);
    }

    /* Add contributions from each corner to get the final noise value.
     * The result is scaled to return values in the interval [-1,1]. */
    noise = 40.0 * (n0 + n1 + n2);

    /* Compute derivative, if requested by supplying non-null pointers
     * for the last two arguments */
    //if ((null != dnoise_dx) && (null != dnoise_dy)) {
    /*  A straight, unoptimised calculation would be like:
     *    *dnoise_dx = -8.0f * t20 * t0 * x0 * ( gx0 * x0 + gy0 * y0 ) + t40 * gx0;
     *    *dnoise_dy = -8.0f * t20 * t0 * y0 * ( gx0 * x0 + gy0 * y0 ) + t40 * gy0;
     *    *dnoise_dx += -8.0f * t21 * t1 * x1 * ( gx1 * x1 + gy1 * y1 ) + t41 * gx1;
     *    *dnoise_dy += -8.0f * t21 * t1 * y1 * ( gx1 * x1 + gy1 * y1 ) + t41 * gy1;
     *    *dnoise_dx += -8.0f * t22 * t2 * x2 * ( gx2 * x2 + gy2 * y2 ) + t42 * gx2;
     *    *dnoise_dy += -8.0f * t22 * t2 * y2 * ( gx2 * x2 + gy2 * y2 ) + t42 * gy2;
     */
    temp0 = t20 * t0 * (gx0 * x0 + gy0 * y0);
    let dnoise_dx = temp0 * x0;
    let dnoise_dy = temp0 * y0;
    temp1 = t21 * t1 * (gx1 * x1 + gy1 * y1);
    dnoise_dx += temp1 * x1;
    dnoise_dy += temp1 * y1;
    temp2 = t22 * t2 * (gx2 * x2 + gy2 * y2);
    dnoise_dx += temp2 * x2;
    dnoise_dy += temp2 * y2;
    dnoise_dx *= -8.0;
    dnoise_dy *= -8.0;
    dnoise_dx += t40 * gx0 + t41 * gx1 + t42 * gx2;
    dnoise_dy += t40 * gy0 + t41 * gy1 + t42 * gy2;
    dnoise_dx *= 40.0; /* Scale derivative to match the noise scaling */
    dnoise_dy *= 40.0;
    //}
    return [noise, dnoise_dx, dnoise_dy];
}

/* Skewing factors for 3D simplex grid:
 * F3 = 1/3
 * G3 = 1/6 */
const F3 = 0.333333333;
const G3 = 0.166666667;

/** 3D simplex noise with derivatives.
 * If the last tthree arguments are not null, the analytic derivative
 * (the 3D gradient of the scalar noise field) is also calculated.
 */
export function sdnoise3(x: number, y: number, z: number): [number, LVector3] {
    let n0, n1, n2, n3; /* Noise contributions from the four simplex corners */
    let noise; /* Return value */
    let gx0, gy0, gz0, gx1, gy1, gz1; /* Gradients at simplex corners */
    let gx2, gy2, gz2, gx3, gy3, gz3;
    let x1, y1, z1, x2, y2, z2, x3, y3, z3;
    let t0, t1, t2, t3, t20, t40, t21, t41, t22, t42, t23, t43;
    let temp0, temp1, temp2, temp3;

    /* Skew the input space to determine which simplex cell we're in */
    let s = (x + y + z) * F3; /* Very nice and simple skew factor for 3D */
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let ii,
        i = FASTFLOOR(xs);
    let jj,
        j = FASTFLOOR(ys);
    let kk,
        k = FASTFLOOR(zs);

    let t = (i + j + k) * G3;
    let X0 = i - t; /* Unskew the cell origin back to (x,y,z) space */
    let Y0 = j - t;
    let Z0 = k - t;
    let x0 = x - X0; /* The x,y,z distances from the cell origin */
    let y0 = y - Y0;
    let z0 = z - Z0;

    /* For the 3D case, the simplex shape is a slightly irregular tetrahedron.
     * Determine which simplex we are in. */
    let i1, j1, k1; /* Offsets for second corner of simplex in (i,j,k) coords */
    let i2, j2, k2; /* Offsets for third corner of simplex in (i,j,k) coords */

    /* TODO: This code would benefit from a backport from the GLSL version! */
    if (x0 >= y0) {
        if (y0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } /* X Y Z order */ else if (x0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } /* X Z Y order */ else {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } /* Z X Y order */
    } else {
        // x0<y0
        if (y0 < z0) {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } /* Z Y X order */ else if (x0 < z0) {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } /* Y Z X order */ else {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } /* Y X Z order */
    }

    /* A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
     * a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
     * a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
     * c = 1/6.   */

    x1 = x0 - i1 + G3; /* Offsets for second corner in (x,y,z) coords */
    y1 = y0 - j1 + G3;
    z1 = z0 - k1 + G3;
    x2 = x0 - i2 + 2.0 * G3; /* Offsets for third corner in (x,y,z) coords */
    y2 = y0 - j2 + 2.0 * G3;
    z2 = z0 - k2 + 2.0 * G3;
    x3 = x0 - 1.0 + 3.0 * G3; /* Offsets for last corner in (x,y,z) coords */
    y3 = y0 - 1.0 + 3.0 * G3;
    z3 = z0 - 1.0 + 3.0 * G3;

    /* Wrap the integer indices at 256, to avoid indexing perm[] out of bounds */
    ii = i % 256;
    jj = j % 256;
    kk = k % 256;

    /* Calculate the contribution from the four corners */
    t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0.0) n0 = t0 = t20 = t40 = gx0 = gy0 = gz0 = 0.0;
    else {
        [gx0, gy0, gz0] = grad3(perm[ii + perm[jj + perm[kk]]]);
        t20 = t0 * t0;
        t40 = t20 * t20;
        n0 = t40 * (gx0 * x0 + gy0 * y0 + gz0 * z0);
    }

    t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0.0) n1 = t1 = t21 = t41 = gx1 = gy1 = gz1 = 0.0;
    else {
        [gx1, gy1, gz1] = grad3(perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]]);
        t21 = t1 * t1;
        t41 = t21 * t21;
        n1 = t41 * (gx1 * x1 + gy1 * y1 + gz1 * z1);
    }

    t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0.0) n2 = t2 = t22 = t42 = gx2 = gy2 = gz2 = 0.0;
    else {
        [gx2, gy2, gz2] = grad3(perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]]);
        t22 = t2 * t2;
        t42 = t22 * t22;
        n2 = t42 * (gx2 * x2 + gy2 * y2 + gz2 * z2);
    }

    t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0.0) n3 = t3 = t23 = t43 = gx3 = gy3 = gz3 = 0.0;
    else {
        [gx3, gy3, gz3] = grad3(perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]]);
        t23 = t3 * t3;
        t43 = t23 * t23;
        n3 = t43 * (gx3 * x3 + gy3 * y3 + gz3 * z3);
    }

    /*  Add contributions from each corner to get the final noise value.
     * The result is scaled to return values in the range [-1,1] */
    noise = 28.0 * (n0 + n1 + n2 + n3);

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
    temp0 = t20 * t0 * (gx0 * x0 + gy0 * y0 + gz0 * z0);
    let dnoise_dx = temp0 * x0;
    let dnoise_dy = temp0 * y0;
    let dnoise_dz = temp0 * z0;
    temp1 = t21 * t1 * (gx1 * x1 + gy1 * y1 + gz1 * z1);
    dnoise_dx += temp1 * x1;
    dnoise_dy += temp1 * y1;
    dnoise_dz += temp1 * z1;
    temp2 = t22 * t2 * (gx2 * x2 + gy2 * y2 + gz2 * z2);
    dnoise_dx += temp2 * x2;
    dnoise_dy += temp2 * y2;
    dnoise_dz += temp2 * z2;
    temp3 = t23 * t3 * (gx3 * x3 + gy3 * y3 + gz3 * z3);
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
    return [noise, new LVector3(dnoise_dx, dnoise_dy, dnoise_dz)];
}

// The skewing and unskewing factors are hairy again for the 4D case
const F4 = 0.309016994; // F4 = (Math.sqrt(5.0)-1.0)/4.0
const G4 = 0.138196601; // G4 = (5.0-Math.sqrt(5.0))/20.0

/** 4D simplex noise with derivatives.
 * If the last four arguments are not null, the analytic derivative
 * (the 4D gradient of the scalar noise field) is also calculated.
 */
export function sdnoise4(x: number, y: number, z: number, w: number, gradient?: IVector3Like): number {
    let n0, n1, n2, n3, n4; // Noise contributions from the five corners
    let noise; // Return value
    let gx0, gy0, gz0, gw0, gx1, gy1, gz1, gw1; /* Gradients at simplex corners */
    let gx2, gy2, gz2, gw2, gx3, gy3, gz3, gw3, gx4, gy4, gz4, gw4;
    let t20, t21, t22, t23, t24;
    let t40, t41, t42, t43, t44;
    let x1, y1, z1, w1, x2, y2, z2, w2, x3, y3, z3, w3, x4, y4, z4, w4;
    let t0, t1, t2, t3, t4;
    let temp0, temp1, temp2, temp3, temp4;

    // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
    let s = (x + y + z + w) * F4; // Factor for 4D skewing
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let ws = w + s;
    let ii,
        i = FASTFLOOR(xs);
    let jj,
        j = FASTFLOOR(ys);
    let kk,
        k = FASTFLOOR(zs);
    let ll,
        l = FASTFLOOR(ws);

    let t = (i + j + k + l) * G4; // Factor for 4D unskewing
    let X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
    let Y0 = j - t;
    let Z0 = k - t;
    let W0 = l - t;

    let x0 = x - X0; // The x,y,z,w distances from the cell origin
    let y0 = y - Y0;
    let z0 = z - Z0;
    let w0 = w - W0;

    // For the 4D case, the simplex is a 4D shape I won't even try to describe.
    // To find out which of the 24 possible simplices we're in, we need to
    // determine the magnitude ordering of x0, y0, z0 and w0.
    // The method below is a reasonable way of finding the ordering of x,y,z,w
    // and then find the correct traversal order for the simplex we�re in.
    // First, six pair-wise comparisons are performed between each possible pair
    // of the four coordinates, and then the results are used to add up binary
    // bits for an integer index into a precomputed lookup table, simplex[].
    let c1 = x0 > y0 ? 32 : 0;
    let c2 = x0 > z0 ? 16 : 0;
    let c3 = y0 > z0 ? 8 : 0;
    let c4 = x0 > w0 ? 4 : 0;
    let c5 = y0 > w0 ? 2 : 0;
    let c6 = z0 > w0 ? 1 : 0;
    let c = c1 | c2 | c3 | c4 | c5 | c6; // '|' is mostly faster than '+'

    let i1, j1, k1, l1; // The integer offsets for the second simplex corner
    let i2, j2, k2, l2; // The integer offsets for the third simplex corner
    let i3, j3, k3, l3; // The integer offsets for the fourth simplex corner

    // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // The number 3 in the "simplex" array is at the position of the largest coordinate.
    i1 = simplex[c][0] >= 3 ? 1 : 0;
    j1 = simplex[c][1] >= 3 ? 1 : 0;
    k1 = simplex[c][2] >= 3 ? 1 : 0;
    l1 = simplex[c][3] >= 3 ? 1 : 0;
    // The number 2 in the "simplex" array is at the second largest coordinate.
    i2 = simplex[c][0] >= 2 ? 1 : 0;
    j2 = simplex[c][1] >= 2 ? 1 : 0;
    k2 = simplex[c][2] >= 2 ? 1 : 0;
    l2 = simplex[c][3] >= 2 ? 1 : 0;
    // The number 1 in the "simplex" array is at the second smallest coordinate.
    i3 = simplex[c][0] >= 1 ? 1 : 0;
    j3 = simplex[c][1] >= 1 ? 1 : 0;
    k3 = simplex[c][2] >= 1 ? 1 : 0;
    l3 = simplex[c][3] >= 1 ? 1 : 0;
    // The fifth corner has all coordinate offsets = 1, so no need to look that up.

    x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
    y1 = y0 - j1 + G4;
    z1 = z0 - k1 + G4;
    w1 = w0 - l1 + G4;
    x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
    y2 = y0 - j2 + 2.0 * G4;
    z2 = z0 - k2 + 2.0 * G4;
    w2 = w0 - l2 + 2.0 * G4;
    x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
    y3 = y0 - j3 + 3.0 * G4;
    z3 = z0 - k3 + 3.0 * G4;
    w3 = w0 - l3 + 3.0 * G4;
    x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
    y4 = y0 - 1.0 + 4.0 * G4;
    z4 = z0 - 1.0 + 4.0 * G4;
    w4 = w0 - 1.0 + 4.0 * G4;

    // Wrap the integer indices at 256, to avoid indexing perm[] out of bounds
    ii = i & 0xff;
    jj = j & 0xff;
    kk = k & 0xff;
    ll = l & 0xff;

    // Calculate the contribution from the five corners
    t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
    if (t0 < 0.0) n0 = t0 = t20 = t40 = gx0 = gy0 = gz0 = gw0 = 0.0;
    else {
        t20 = t0 * t0;
        t40 = t20 * t20;
        [gx0, gy0, gz0, gw0] = grad4(perm[ii + perm[jj + perm[kk + perm[ll]]]]);
        n0 = t40 * (gx0 * x0 + gy0 * y0 + gz0 * z0 + gw0 * w0);
    }

    t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
    if (t1 < 0.0) n1 = t1 = t21 = t41 = gx1 = gy1 = gz1 = gw1 = 0.0;
    else {
        t21 = t1 * t1;
        t41 = t21 * t21;
        [gx1, gy1, gz1, gw1] = grad4(perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]]);
        n1 = t41 * (gx1 * x1 + gy1 * y1 + gz1 * z1 + gw1 * w1);
    }

    t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
    if (t2 < 0.0) n2 = t2 = t22 = t42 = gx2 = gy2 = gz2 = gw2 = 0.0;
    else {
        t22 = t2 * t2;
        t42 = t22 * t22;
        [gx2, gy2, gz2, gw2] = grad4(perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]]);
        n2 = t42 * (gx2 * x2 + gy2 * y2 + gz2 * z2 + gw2 * w2);
    }

    t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
    if (t3 < 0.0) n3 = t3 = t23 = t43 = gx3 = gy3 = gz3 = gw3 = 0.0;
    else {
        t23 = t3 * t3;
        t43 = t23 * t23;
        [gx3, gy3, gz3, gw3] = grad4(perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]]);
        n3 = t43 * (gx3 * x3 + gy3 * y3 + gz3 * z3 + gw3 * w3);
    }

    t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
    if (t4 < 0.0) n4 = t4 = t24 = t44 = gx4 = gy4 = gz4 = gw4 = 0.0;
    else {
        t24 = t4 * t4;
        t44 = t24 * t24;
        [gx4, gy4, gz4, gw4] = grad4(perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]]);
        n4 = t44 * (gx4 * x4 + gy4 * y4 + gz4 * z4 + gw4 * w4);
    }

    // Sum up and scale the result to cover the range [-1,1]
    noise = 27.0 * (n0 + n1 + n2 + n3 + n4); // TODO: The scale factor is preliminary!

    /* Compute derivative, if requested by supplying non-null pointers
     * for the last four arguments */
    if (gradient != null) {
        /*  A straight, unoptimised calculation would be like:
         *     *dnoise_dx = -8.0f * t20 * t0 * x0 * dot(gx0, gy0, gz0, gw0, x0, y0, z0, w0) + t40 * gx0;
         *    *dnoise_dy = -8.0f * t20 * t0 * y0 * dot(gx0, gy0, gz0, gw0, x0, y0, z0, w0) + t40 * gy0;
         *    *dnoise_dz = -8.0f * t20 * t0 * z0 * dot(gx0, gy0, gz0, gw0, x0, y0, z0, w0) + t40 * gz0;
         *    *dnoise_dw = -8.0f * t20 * t0 * w0 * dot(gx0, gy0, gz0, gw0, x0, y0, z0, w0) + t40 * gw0;
         *    *dnoise_dx += -8.0f * t21 * t1 * x1 * dot(gx1, gy1, gz1, gw1, x1, y1, z1, w1) + t41 * gx1;
         *    *dnoise_dy += -8.0f * t21 * t1 * y1 * dot(gx1, gy1, gz1, gw1, x1, y1, z1, w1) + t41 * gy1;
         *    *dnoise_dz += -8.0f * t21 * t1 * z1 * dot(gx1, gy1, gz1, gw1, x1, y1, z1, w1) + t41 * gz1;
         *    *dnoise_dw = -8.0f * t21 * t1 * w1 * dot(gx1, gy1, gz1, gw1, x1, y1, z1, w1) + t41 * gw1;
         *    *dnoise_dx += -8.0f * t22 * t2 * x2 * dot(gx2, gy2, gz2, gw2, x2, y2, z2, w2) + t42 * gx2;
         *    *dnoise_dy += -8.0f * t22 * t2 * y2 * dot(gx2, gy2, gz2, gw2, x2, y2, z2, w2) + t42 * gy2;
         *    *dnoise_dz += -8.0f * t22 * t2 * z2 * dot(gx2, gy2, gz2, gw2, x2, y2, z2, w2) + t42 * gz2;
         *    *dnoise_dw += -8.0f * t22 * t2 * w2 * dot(gx2, gy2, gz2, gw2, x2, y2, z2, w2) + t42 * gw2;
         *    *dnoise_dx += -8.0f * t23 * t3 * x3 * dot(gx3, gy3, gz3, gw3, x3, y3, z3, w3) + t43 * gx3;
         *    *dnoise_dy += -8.0f * t23 * t3 * y3 * dot(gx3, gy3, gz3, gw3, x3, y3, z3, w3) + t43 * gy3;
         *    *dnoise_dz += -8.0f * t23 * t3 * z3 * dot(gx3, gy3, gz3, gw3, x3, y3, z3, w3) + t43 * gz3;
         *    *dnoise_dw += -8.0f * t23 * t3 * w3 * dot(gx3, gy3, gz3, gw3, x3, y3, z3, w3) + t43 * gw3;
         *    *dnoise_dx += -8.0f * t24 * t4 * x4 * dot(gx4, gy4, gz4, gw4, x4, y4, z4, w4) + t44 * gx4;
         *    *dnoise_dy += -8.0f * t24 * t4 * y4 * dot(gx4, gy4, gz4, gw4, x4, y4, z4, w4) + t44 * gy4;
         *    *dnoise_dz += -8.0f * t24 * t4 * z4 * dot(gx4, gy4, gz4, gw4, x4, y4, z4, w4) + t44 * gz4;
         *    *dnoise_dw += -8.0f * t24 * t4 * w4 * dot(gx4, gy4, gz4, gw4, x4, y4, z4, w4) + t44 * gw4;
         */
        temp0 = t20 * t0 * (gx0 * x0 + gy0 * y0 + gz0 * z0 + gw0 * w0);
        let dnoise_dx = temp0 * x0;
        let dnoise_dy = temp0 * y0;
        let dnoise_dz = temp0 * z0;
        let dnoise_dw = temp0 * w0;
        temp1 = t21 * t1 * (gx1 * x1 + gy1 * y1 + gz1 * z1 + gw1 * w1);
        dnoise_dx += temp1 * x1;
        dnoise_dy += temp1 * y1;
        dnoise_dz += temp1 * z1;
        dnoise_dw += temp1 * w1;
        temp2 = t22 * t2 * (gx2 * x2 + gy2 * y2 + gz2 * z2 + gw2 * w2);
        dnoise_dx += temp2 * x2;
        dnoise_dy += temp2 * y2;
        dnoise_dz += temp2 * z2;
        dnoise_dw += temp2 * w2;
        temp3 = t23 * t3 * (gx3 * x3 + gy3 * y3 + gz3 * z3 + gw3 * w3);
        dnoise_dx += temp3 * x3;
        dnoise_dy += temp3 * y3;
        dnoise_dz += temp3 * z3;
        dnoise_dw += temp3 * w3;
        temp4 = t24 * t4 * (gx4 * x4 + gy4 * y4 + gz4 * z4 + gw4 * w4);
        dnoise_dx += temp4 * x4;
        dnoise_dy += temp4 * y4;
        dnoise_dz += temp4 * z4;
        dnoise_dw += temp4 * w4;
        dnoise_dx *= -8.0;
        dnoise_dy *= -8.0;
        dnoise_dz *= -8.0;
        dnoise_dw *= -8.0;
        dnoise_dx += t40 * gx0 + t41 * gx1 + t42 * gx2 + t43 * gx3 + t44 * gx4;
        dnoise_dy += t40 * gy0 + t41 * gy1 + t42 * gy2 + t43 * gy3 + t44 * gy4;
        dnoise_dz += t40 * gz0 + t41 * gz1 + t42 * gz2 + t43 * gz3 + t44 * gz4;
        dnoise_dw += t40 * gw0 + t41 * gw1 + t42 * gw2 + t43 * gw3 + t44 * gw4;
        dnoise_dx *= 28.0; /* Scale derivative to match the noise scaling */
        dnoise_dy *= 28.0;
        dnoise_dz *= 28.0;
        dnoise_dw *= 28.0;

        gradient.x = dnoise_dx;
        gradient.y = dnoise_dy;
        gradient.z = dnoise_dz;
    }

    return noise;
}

/**
 * Returns a random value in [0,1] based on simplex noise and computes the gradient if specified
 * @param vector the position to sample the noise at
 * @param gradient the recipient for the gradient (will be overridden)
 * @param seed an offset along the 4th dimension
 */
export function simplex401(vector: IVector3Like, gradient?: LVector3, seed = 0): number {
    let noiseValue = sdnoise4(vector.x, vector.y, vector.z, seed, gradient);

    // [0,1] is half the length of [-1,1]
    if (gradient) gradient.divideInPlace(2);
    return (noiseValue + 1) / 2;
}

/**
 * Returns a random value in [-1,1] based on simplex noise and computes the gradient if specified
 * @param vector the position to sample the noise at
 * @param gradient the recipient for the gradient (will be overridden)
 * @param seed an offset along the 4th dimension
 */
export function simplex411(vector: IVector3Like, gradient?: IVector3Like, seed = 0): number {
    return sdnoise4(vector.x, vector.y, vector.z, seed, gradient);
}
