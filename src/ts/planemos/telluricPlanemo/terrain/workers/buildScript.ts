import { TransferBuildData } from "../chunks/workerDataTypes";
import { build_chunk_vertex_data, BuildData, TerrainSettings } from "terrain-generation";
import { ReturnedChunkData } from "../chunks/taskTypes";

function handle_build(data: TransferBuildData): void {
    const nbVerticesPerSide = data.nbVerticesPerSide;
    const nbSubdivisions = nbVerticesPerSide - 1;

    const verticesPositions = new Float32Array(nbVerticesPerSide * nbVerticesPerSide * 3);
    const indices = new Uint16Array(nbSubdivisions * nbSubdivisions * 2 * 3);
    const normals = new Float32Array(verticesPositions.length);

    const size = data.planetDiameter / 2 ** data.depth;
    const space_between_vertices = size / nbSubdivisions;
    const scatter_per_square_meter = space_between_vertices < 15.0 ? 0.1 : 0;

    const flat_area = size * size;
    const max_nb_instances = Math.floor(flat_area * scatter_per_square_meter * 2.0);
    console.log(scatter_per_square_meter, data.depth, space_between_vertices, max_nb_instances);
    const instances_matrix_buffer = new Float32Array(16 * max_nb_instances);
    const aligned_instances_matrix_buffer = new Float32Array(16 * max_nb_instances);

    const terrain_settings = new TerrainSettings();
    terrain_settings.continent_base_height = data.terrainSettings.continent_base_height;
    terrain_settings.continents_fragmentation = data.terrainSettings.continents_fragmentation;
    terrain_settings.continents_frequency = data.terrainSettings.continents_frequency;

    terrain_settings.max_mountain_height = data.terrainSettings.max_mountain_height;
    terrain_settings.mountains_frequency = data.terrainSettings.mountains_frequency;

    terrain_settings.bumps_frequency = data.terrainSettings.bumps_frequency;
    terrain_settings.max_bump_height = data.terrainSettings.max_bump_height;

    const buildData: BuildData = new BuildData(
        data.planetDiameter,
        data.depth,
        data.direction,
        data.position[0],
        data.position[1],
        data.position[2],
        data.seed,
        data.nbVerticesPerSide,
        terrain_settings
    );

    build_chunk_vertex_data(buildData, verticesPositions, indices, normals, instances_matrix_buffer, aligned_instances_matrix_buffer, scatter_per_square_meter);

    console.log(aligned_instances_matrix_buffer);

    self.postMessage(
        {
            positions: verticesPositions,
            indices: indices,
            normals: normals,
            instancesMatrixBuffer: instances_matrix_buffer,
            alignedInstancesMatrixBuffer: aligned_instances_matrix_buffer
        } as ReturnedChunkData,
        {
            transfer: [verticesPositions.buffer, indices.buffer, normals.buffer, instances_matrix_buffer.buffer, aligned_instances_matrix_buffer.buffer]
        }
    );

    buildData.free();
}

self.onmessage = (e) => {
    //const clock = Date.now();
    handle_build(e.data as TransferBuildData);
    //console.log("The chunk took: " + (Date.now() - clock));

    // benchmark fait le 5/10/2021 (normale non analytique) : ~2s/chunk
    // benchmark fait le 12/11/2021 (normale non analyique) : ~0.5s/chunk
    // benchmark fait le 20/11/2021 20h30 (normale analytique v2) : ~0.8s/chunk
    // benchmark fait le 20/11/2021 21h20 (normale analytique v2.1) : ~0.03s/chunk (30ms/chunk)
    // benchmark fait le 10/12/2021 (normale analytique v2.5) : ~ 50ms/chunk
    // benchmark fait le 19/02/2022 (normale analytique v2.6) : ~ 40ms/chunk
    // benchmark fait le 28/07/2022 (Terrain V3.1) : ~70ms/chunk
    // benchmark fait le 06/12/2022 (Terrain WASM v1) : ~140ms/chunk wtf
    // benchmark fait le 06/12/2022 (Terrain WASM v1.5) : ~60ms/chunk
};
