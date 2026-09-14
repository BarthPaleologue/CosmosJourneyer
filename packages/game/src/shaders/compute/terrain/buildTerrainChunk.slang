#include "./proceduralTerrain.slang"

[vk::binding(0, 0)]
RWStructuredBuffer<float4> positions;

[vk::binding(1, 0)]
RWStructuredBuffer<float4> normals;

[vk::binding(2, 0)]
StructuredBuffer<float> params;

float3 positionOnCube(float x, float y)
{
    uint rowVertexCount = uint(params[0]);
    float halfSubdivisions = float(rowVertexCount - 1) * 0.5;
    float scale = params[1] / float(rowVertexCount - 1);
    float localX = (x - halfSubdivisions) * scale;
    float localY = (y - halfSubdivisions) * scale;
    uint face = uint(params[2]);
    float3 center = float3(params[4], params[5], params[6]);
    float3 offset = float3(localX, localY, 0.0);

    switch (face)
    {
        case 0:
            offset = float3(localX, 0.0, localY);
            break;
        case 1:
            offset = float3(localY, 0.0, localX);
            break;
        case 2:
            offset = float3(0.0, localX, localY);
            break;
        case 3:
            offset = float3(0.0, localY, localX);
            break;
        case 4:
            offset = float3(localX, localY, 0.0);
            break;
        case 5:
            offset = float3(localY, localX, 0.0);
            break;
        default:
            break;
    }

    return center + offset;
}

float3 displacedPosition(float x, float y)
{
    float3 unitPosition = normalize(positionOnCube(x, y));
    TerrainSettings settings = {
        params[7],
        params[8],
        params[9],
        params[10],
        params[11],
        params[12],
        params[13],
        params[14],
        params[15],
        params[16],
        params[17],
        params[18],
    };
    return unitPosition * (params[3] + terrainElevation(unitPosition, settings));
}

[shader("compute")]
[numthreads(8, 8, 1)]
void main(uint3 id : SV_DispatchThreadID)
{
    uint rowVertexCount = uint(params[0]);
    if (id.x >= rowVertexCount || id.y >= rowVertexCount)
    {
        return;
    }

    float x = float(id.x);
    float y = float(id.y);
    float3 absolutePosition = displacedPosition(x, y);
    float3 chunkSpherePosition = normalize(float3(params[4], params[5], params[6])) * params[3];
    float3 tangentX = displacedPosition(x + 1.0, y) - displacedPosition(x - 1.0, y);
    float3 tangentY = displacedPosition(x, y + 1.0) - displacedPosition(x, y - 1.0);
    float3 normal = normalize(cross(tangentY, tangentX));
    if (dot(normal, absolutePosition) < 0.0)
    {
        normal = -normal;
    }

    uint index = id.x * rowVertexCount + id.y;
    positions[index] = float4(absolutePosition - chunkSpherePosition, 1.0);
    normals[index] = float4(normal, 0.0);
}
