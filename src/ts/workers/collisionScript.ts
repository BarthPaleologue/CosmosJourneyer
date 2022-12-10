import { TransferCollisionData } from "../chunks/workerDataTypes";

import { CollisionData, compute_height_at_point, TerrainSettings } from "terrain-generation";

function computeHeightForData(data: TransferCollisionData): void {
    const terrain_settings = new TerrainSettings();
    terrain_settings.continent_base_height = data.terrainSettings.continent_base_height;
    terrain_settings.continents_fragmentation = data.terrainSettings.continents_fragmentation;
    terrain_settings.continents_frequency = data.terrainSettings.continents_frequency;

    terrain_settings.max_mountain_height = data.terrainSettings.max_mountain_height;
    terrain_settings.mountains_frequency = data.terrainSettings.mountains_frequency;

    terrain_settings.bumps_frequency = data.terrainSettings.bumps_frequency;
    terrain_settings.max_bump_height = data.terrainSettings.max_bump_height;

    const collision_data = new CollisionData();
    collision_data.planet_seed = data.seed;
    collision_data.planet_diameter = data.planetDiameter;
    collision_data.sample_x = data.position[0];
    collision_data.sample_y = data.position[1];
    collision_data.sample_z = data.position[2];
    collision_data.terrain_settings = terrain_settings;

    const height = compute_height_at_point(collision_data);

    self.postMessage({ h: height });
}

self.onmessage = (e) => {
    computeHeightForData(e.data as TransferCollisionData);
};
