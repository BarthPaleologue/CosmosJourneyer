/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
function fract(x) {
    return x - Math.floor(x);
}
export function random3(c) {
    let j = 4096.0 * Math.sin(BABYLON.Vector3.Dot(c, new BABYLON.Vector3(17.0, 59.4, 15.0)));
    let r = new BABYLON.Vector3();
    r.z = fract(512.0 * j);
    j *= .125;
    r.x = fract(512.0 * j);
    j *= .125;
    r.y = fract(512.0 * j);
    return r.subtract(new BABYLON.Vector3(0.5, 0.5, 0.5));
}
function dot(v1, v2) {
    return BABYLON.Vector3.Dot(v1, v2);
}
function prod(v1, v2) {
    return new BABYLON.Vector3(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);
}
function step(edge, x) {
    return new BABYLON.Vector3(x.x < edge.x ? 0 : 1, x.y < edge.y ? 0 : 1, x.z < edge.z ? 0 : 1);
}
function yzx(v) {
    return new BABYLON.Vector3(v.y, v.z, v.x);
}
function zxy(v) {
    return new BABYLON.Vector3(v.z, v.x, v.y);
}
/* skew constants for 3d simplex functions */
const F3 = 0.3333333;
const G3 = 0.1666667;
/* 3d simplex noise */
function simplex3d(p) {
    /* 1. find current tetrahedron T and it's four vertices */
    /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
    /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
    /* calculate s and x */
    let s1 = dot(p, new BABYLON.Vector3(F3, F3, F3));
    let s = (p.subtract(new BABYLON.Vector3(s1, s1, s1))).floor();
    let x1 = dot(s, new BABYLON.Vector3(G3, G3, G3));
    let x = p.subtract(s).add(new BABYLON.Vector3(x1));
    let unos = new BABYLON.Vector3(1.0, 1.0, 1.0);
    /* calculate i1 and i2 */
    let e = step(BABYLON.Vector3.Zero(), x.subtract(yzx(x)));
    let i1 = prod(e, unos.subtract(zxy(e)));
    let i2 = prod(unos.subtract(zxy(e)), unos.subtract(e));
    /* x1, x2, x3 */
    vec3;
    x1 = x - i1 + G3;
    vec3;
    x2 = x - i2 + 2.0 * G3;
    vec3;
    x3 = x - 1.0 + 3.0 * G3;
    /* 2. find four surflets and store them in d */
    vec4;
    w, d;
    /* calculate surflet weights */
    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);
    /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
    w = max(0.6 - w, 0.0);
    /* calculate surflet components */
    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);
    /* multiply d by w^4 */
    w *= w;
    w *= w;
    d *= w;
    /* 3. return the sum of the four surflets */
    return dot(d, vec4(52.0));
}
float;
normalNoise(vec3, coords);
{
    return 0.5 * (1.0 + simplex3d(coords));
}
float;
completeNoise(vec3, coords, int, octaves, float, decay, float, lacunarity);
{
    float;
    noiseValue = 0.0;
    float;
    totalAmplitude = 0.0;
    for (int; i = 0; i < octaves)
        ;
    i++;
    {
        noiseValue += normalNoise(vec3(vec2(coords.x, coords.y) * pow(lacunarity, float(i)), coords.z)) / pow(decay, float(i));
        totalAmplitude += 1.0 / pow(decay, float(i));
    }
    noiseValue /= totalAmplitude;
    return noiseValue;
}
bool;
near(float, value, float, target, float, tolerance);
{
    return abs(value - target) < tolerance;
}
