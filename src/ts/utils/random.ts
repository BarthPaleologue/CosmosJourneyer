//http://corysimon.github.io/articles/uniformdistn-on-sphere/

/**
 * Generate a uniform random coordinate on the unit sphere
 * @returns a uniform random coordinate on the unit sphere
 */
export function sphereRandom(radius = 1, rand = Math.random): number[] {
    const theta = 2 * Math.PI * rand();
    const phi = Math.acos(1 - 2 * rand());

    const x = Math.sin(phi) * Math.cos(theta) * radius;
    const y = Math.sin(phi) * Math.sin(theta) * radius;
    const z = Math.cos(phi) * radius;

    return [x, y, z];
}

export function centeredRandom(rand = Math.random): number {
    return (rand() - 0.5) * 2;
}

export function randRangeInt(min: number, max: number, rand = Math.random): number {
    return Math.floor(rand() * (max - min + 1)) + min;
}

// TODO: implement PRNG with bigints
export function randRangeBigInt(min: bigint, max: bigint, rand: () => bigint): bigint {
    return BigInt(rand() * (max - min + 1n)) + min;
}

export function randRange(min = 0, max = 1, rand = Math.random): number {
    return rand() * (max - min) + min;
}

export function normalRandom(mean: number, std: number, rand = Math.random): number {
    // Box-Muller transform
    //https://www.baeldung.com/cs/uniform-to-normal-distribution
    return mean + std * Math.sqrt(-2 * Math.log(rand())) * Math.cos(2 * Math.PI * rand());
}

export function randBool(p: number, rand = Math.random) {
    return rand() < p;
}

export function unpackSeedToVector3(seed: number): [number, number, number] {
    const seedString = seed.toString();
    let xString = "0";
    let yString = "0";
    let zString = "0";
    for(let i = 0; i < seedString.length; i++) {
        const newChar = seedString[i];
        switch (i%3) {
            case 0:
                xString += newChar;
                break;
            case 1:
                yString += newChar;
                break;
            case 2:
                zString += newChar;
        }
    }
    return [Number(xString), Number(yString), Number(zString)];
}