use terrain_generation::build_chunk_vertex_data;
use terrain_generation::build_data::BuildData;
use terrain_generation::terrain_settings::TerrainSettings;
use terrain_generation::utils::direction::Direction;

fn make_settings(continent_base_height: f32) -> TerrainSettings {
    TerrainSettings {
        planet_diameter: 1_000.0,
        seed: 42.0,
        continents_frequency: 1.0,
        bumps_frequency: 1.0,
        mountains_frequency: 1.0,
        continents_fragmentation: 0.0,
        continent_base_height,
        max_mountain_height: 0.0,
        max_bump_height: 0.0,
    }
}

fn build_positions(terrain_settings: TerrainSettings) -> [f32; 12] {
    let build_data = BuildData {
        chunk_depth: 0,
        chunk_tree_direction: Direction::Forward,
        chunk_cube_position_x: 0.0,
        chunk_cube_position_y: 0.0,
        chunk_cube_position_z: -500.0,
        resolution: 2,
        terrain_settings,
    };
    let mut positions = [0.0; 12];
    let mut normals = [0.0; 12];
    let mut indices = [0; 6];

    build_chunk_vertex_data(
        &build_data,
        &mut positions,
        &mut indices,
        &mut normals,
        &mut [],
        0.0,
    );

    positions
}

#[test]
fn invalidates_cached_terrain_when_settings_change_with_the_same_seed() {
    let first_positions = build_positions(make_settings(10.0));
    let second_positions = build_positions(make_settings(20.0));

    assert_ne!(first_positions, second_positions);
}
