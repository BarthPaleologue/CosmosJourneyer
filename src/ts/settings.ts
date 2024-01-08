import { seededSquirrelNoise } from "squirrel-noise";
import { makeNoise3D } from "fast-simplex-noise";

export const Settings = {
    UNIVERSE_SEED: Math.PI,
    EARTH_RADIUS: 1000e3, // target is 6000e3
    AU: 150e9, // target is 150e9

    VERTEX_RESOLUTION: 64,
    MIN_DISTANCE_BETWEEN_VERTICES: 6,

    CLOUD_LAYER_HEIGHT: 15e3,
    ATMOSPHERE_HEIGHT: 100e3,
    OCEAN_DEPTH: 7e3,

    TIME_MULTIPLIER: 1,
    CHUNK_RENDER_DISTANCE_MULTIPLIER: 2,
    ENABLE_VOLUMETRIC_CLOUDS: false,
    SEED_HALF_RANGE: 1e6,
    C: 299792458,
    FOV: (92 * Math.PI) / 180
};

export const CollisionMask = {
    GROUND: 0b00000001,
    SPACESHIP: 0b00000010,
}

const seedableRNG = seededSquirrelNoise(Settings.UNIVERSE_SEED);
let step = 0;
const perlinRNG = makeNoise3D(() => {
    return seedableRNG(step++);
});
export const UniverseDensity = (x: number, y: number, z: number) => (1.0 - Math.abs(perlinRNG(x * 0.2, y * 0.2, z * 0.2))) ** 8;
