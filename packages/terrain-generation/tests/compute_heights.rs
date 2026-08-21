use terrain_generation::compute_heights;
use terrain_generation::terrain_settings::TerrainSettings;

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

#[test]
fn computes_heights_for_each_geographic_coordinate() {
    let coordinates = [0.0, 0.0, std::f64::consts::FRAC_PI_2, 0.0];
    let mut heights = [0.0; 2];

    compute_heights(&make_settings(10.0), &coordinates, &mut heights);

    assert_eq!(heights, [10.0, 10.0]);
}
