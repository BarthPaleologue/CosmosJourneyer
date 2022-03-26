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

export function centeredRandom(): number {
    return (Math.random() - 0.5) * 2;
}

export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rand(min = 0, max = 1): number {
    return Math.random() * (max - min) + min;
}

export function nrand(mean: number, std: number): number {
    // Box-Muller transform
    //https://www.baeldung.com/cs/uniform-to-normal-distribution
    return mean + std * Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}