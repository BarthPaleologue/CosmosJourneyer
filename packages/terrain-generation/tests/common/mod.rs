use terrain_generation::terrain_settings::TerrainSettings;

#[allow(dead_code)]
pub const OCEAN_DEPTH: f32 = 7e3;

#[allow(dead_code)]
pub const SETTINGS: TerrainSettings = TerrainSettings {
    continents_frequency: 1.0,
    bumps_frequency: 10.0,
    mountains_frequency: 20.0,
    continents_fragmentation: 0.3,
    continent_base_height: OCEAN_DEPTH * 2.5,
    max_mountain_height: 15e3,
    max_bump_height: 2e3,
};

pub const SEED: f32 = 11.0;

#[allow(dead_code)]
pub const PLANET_RADIUS: f32 = 1000e3;
