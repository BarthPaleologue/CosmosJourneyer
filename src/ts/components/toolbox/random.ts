//http://corysimon.github.io/articles/uniformdistn-on-sphere/
/**
 * Generate a uniform random coordinate on the unit sphere
 * @returns a uniform random coordinate on the unit sphere
 */
export function uniformRandomSphere(): number[] {
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(1 - 2 * Math.random());

    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);

    return [x, y, z];
}