use crate::terrain_settings::TerrainSettings;
use crate::utils::direction::Direction;
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
pub struct BuildData {
    /// The diameter of the planet
    pub planet_diameter: f32,
    /// The depth of the chunk to generate in the quadtree (starts at 0!)
    pub chunk_depth: u32,
    /// The direction of the quadtree in space
    pub chunk_tree_direction: Direction,
    /// The x position of the chunk on the cube sphere
    pub chunk_cube_position_x: f32,
    /// The y position of the chunk on the cube sphere
    pub chunk_cube_position_y: f32,
    /// The z position of the chunk on the cube sphere
    pub chunk_cube_position_z: f32,
    /// The seed of the planet we are generating
    pub planet_seed: f32,
    /// The resolution of each chunk (x*x vertices)
    pub resolution: u32,
    /// The settings guiding the terrain generation
    pub terrain_settings: TerrainSettings,
}

#[wasm_bindgen]
impl BuildData {
    #[wasm_bindgen(constructor)]
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        planet_diameter: f32,
        chunk_depth: u32,
        chunk_tree_direction: Direction,
        chunk_cube_position_x: f32,
        chunk_cube_position_y: f32,
        chunk_cube_position_z: f32,
        planet_seed: f32,
        resolution: u32,
        terrain_settings: TerrainSettings,
    ) -> BuildData {
        BuildData {
            planet_diameter,
            chunk_depth,
            chunk_tree_direction,
            chunk_cube_position_x,
            chunk_cube_position_y,
            chunk_cube_position_z,
            planet_seed,
            resolution,
            terrain_settings,
        }
    }
}
