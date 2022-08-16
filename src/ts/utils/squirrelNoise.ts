/**
 * From Squirrel Eiserloh's GDC conference
 * @param seed the seed of the noise
 * @param step the step of the noise
 * @see https://www.youtube.com/watch?v=LWFzPP8ZbdU
 */
export function squirrelNoise(seed: number, step: number) {
    const BIT_NOISE1 = 0x68E31DA4;
    const BIT_NOISE2 = 0xB5297A4D;
    const BIT_NOISE3 = 0x1B56C4E9;

    let mangled_bits = step;
    mangled_bits *= BIT_NOISE1;
    mangled_bits += seed;
    mangled_bits ^= mangled_bits >> 8;
    mangled_bits += BIT_NOISE2;
    mangled_bits ^= mangled_bits << 8;
    mangled_bits *= BIT_NOISE3;
    mangled_bits ^= mangled_bits >> 8;

    return mangled_bits / (2**31 - 1);
}

/**
 *
 * @param seed the seed of the noise
 */
export function seededSquirrelNoise(seed: number) {
    return (step: number) => squirrelNoise(seed, step);
}