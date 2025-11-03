use wasm_bindgen::prelude::wasm_bindgen;

#[derive(Copy, Clone)]
#[wasm_bindgen]
pub struct TerrainSettings {
    pub continents_frequency: f32,
    pub bumps_frequency: f32,
    pub mountains_frequency: f32,
    pub continents_fragmentation: f32,
    pub continent_base_height: f32,
    pub max_mountain_height: f32,
    pub max_bump_height: f32,
}

#[wasm_bindgen]
impl TerrainSettings {
    #[wasm_bindgen(constructor)]
    pub fn new() -> TerrainSettings {
        TerrainSettings {
            continents_frequency: 1.0,
            bumps_frequency: 1.0,
            mountains_frequency: 1.0,
            continents_fragmentation: 1.0,
            continent_base_height: 1.0,
            max_mountain_height: 1.0,
            max_bump_height: 1.0,
        }
    }
}
