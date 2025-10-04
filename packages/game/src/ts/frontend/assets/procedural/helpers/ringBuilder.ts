import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { type Scene } from "@babylonjs/core/scene";

/**
 * Create two walled cylinder with a hole in the middle.
 * @param radius The radius of the cylinder between the two walls.
 * @param thickness The separation between the two walls.
 * @param height The height of the cylinder.
 * @param tesselation The number of sides of the cylinder.
 */
export function createRingVertexData(radius: number, thickness: number, height: number, tesselation: number) {
    const indices: number[] = [];
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs = [];

    const innerRadius = radius - thickness / 2;
    const outerRadius = radius + thickness / 2;

    for (let i = 0; i <= tesselation; i++) {
        const angle = (i * Math.PI * 2.0) / tesselation;
        const dx = Math.cos(angle);
        const dz = Math.sin(angle);

        // bottom strip
        const innerBottomPosition = new Vector3(innerRadius * dx, -height / 2, innerRadius * dz);
        positions.push(innerBottomPosition.x, innerBottomPosition.y, innerBottomPosition.z);
        normals.push(0, -1, 0);
        const outerBottomPosition = new Vector3(outerRadius * dx, -height / 2, outerRadius * dz);
        positions.push(outerBottomPosition.x, outerBottomPosition.y, outerBottomPosition.z);
        normals.push(0, -1, 0);

        uvs.push(i / tesselation, 0);
        uvs.push(i / tesselation, 1);

        // top strip
        const innerTopPosition = new Vector3(innerRadius * dx, height / 2, innerRadius * dz);
        positions.push(innerTopPosition.x, innerTopPosition.y, innerTopPosition.z);
        normals.push(0, 1, 0);
        const outerTopPosition = new Vector3(outerRadius * dx, height / 2, outerRadius * dz);
        positions.push(outerTopPosition.x, outerTopPosition.y, outerTopPosition.z);
        normals.push(0, 1, 0);

        uvs.push(i / tesselation, 1);
        uvs.push(i / tesselation, 0);

        // outer strip
        positions.push(outerBottomPosition.x, outerBottomPosition.y, outerBottomPosition.z);
        normals.push(dx, 0, dz);
        positions.push(outerTopPosition.x, outerTopPosition.y, outerTopPosition.z);
        normals.push(dx, 0, dz);

        uvs.push(i / tesselation, 0);
        uvs.push(i / tesselation, 1);

        // inner strip
        positions.push(innerBottomPosition.x, innerBottomPosition.y, innerBottomPosition.z);
        normals.push(-dx, 0, -dz);
        positions.push(innerTopPosition.x, innerTopPosition.y, innerTopPosition.z);
        normals.push(-dx, 0, -dz);

        uvs.push(i / tesselation, 1);
        uvs.push(i / tesselation, 0);

        if (i === 0) continue;

        const stride = 8;

        const previousBottomIndex = stride * (i - 1) + 0;
        const currentBottomIndex = stride * i + 0;

        indices.push(currentBottomIndex + 1, previousBottomIndex + 1, previousBottomIndex);
        indices.push(currentBottomIndex, currentBottomIndex + 1, previousBottomIndex);

        const previousTopIndex = stride * (i - 1) + 2;
        const currentTopIndex = stride * i + 2;

        indices.push(previousTopIndex, previousTopIndex + 1, currentTopIndex + 1);
        indices.push(previousTopIndex, currentTopIndex + 1, currentTopIndex);

        const previousOuterIndex = stride * (i - 1) + 4;
        const currentOuterIndex = stride * i + 4;

        indices.push(currentOuterIndex + 1, previousOuterIndex + 1, previousOuterIndex);
        indices.push(currentOuterIndex, currentOuterIndex + 1, previousOuterIndex);

        const previousInnerIndex = stride * (i - 1) + 6;
        const currentInnerIndex = stride * i + 6;

        indices.push(previousInnerIndex, previousInnerIndex + 1, currentInnerIndex + 1);
        indices.push(previousInnerIndex, currentInnerIndex + 1, currentInnerIndex);
    }

    const vertexData = new VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

export function createRing(radius: number, thickness: number, height: number, tesselation: number, scene: Scene) {
    const vertexData = createRingVertexData(radius, thickness, height, tesselation);
    const ring = new Mesh("ring", scene);
    vertexData.applyToMesh(ring);
    ring.convertToFlatShadedMesh();
    return ring;
}
