#include "./proceduralTerrain.slang"

[vk::binding(0, 0)]
StructuredBuffer<float2> coordinates;

[vk::binding(1, 0)]
RWStructuredBuffer<float> heights;

[vk::binding(2, 0)]
StructuredBuffer<float> params;

[shader("compute")]
[numthreads(64, 1, 1)]
void main(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= uint(params[0]))
    {
        return;
    }

    float2 coordinate = coordinates[id.x];
    float cosLatitude = cos(coordinate.x);
    float3 unitPosition = float3(
        cosLatitude * cos(coordinate.y),
        sin(coordinate.x),
        cosLatitude * sin(coordinate.y)
    );
    TerrainSettings settings = {
        params[1],
        params[2],
        params[3],
        params[4],
        params[5],
        params[6],
        params[7],
        params[8],
        params[9],
        params[10],
        params[11],
        params[12],
    };
    heights[id.x] = terrainElevation(unitPosition, settings);
}
