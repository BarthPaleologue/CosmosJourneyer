import type { Vector4 } from "@babylonjs/core/Maths/math.vector";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

const signedPow = (value: number, power: number): number => {
    return Math.sign(value) * Math.pow(Math.abs(value), power);
};

const computeLpCirclePoint = (angle: number, radius: number, exponent: number): { x: number; y: number } => {
    const power = 2 / exponent;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        x: radius * signedPow(cos, power),
        y: radius * signedPow(sin, power),
    };
};

/**
 * Creates the VertexData for a torus
 * @param options Optional geometry and UV settings.
 * @param options.diameter Outer diameter; defaults to 1.
 * @param options.thickness Tube diameter; defaults to 0.5.
 * @param options.tessellation Number of subdivisions; defaults to 24.
 * @param options.sideOrientation Face orientation; defaults to `Mesh.FRONTSIDE`.
 * @param options.frontUVs UV rectangle for the front face when using double-sided geometry.
 * @param options.backUVs UV rectangle for the back face when using double-sided geometry.
 * @param options.majorLpExponent Exponent for the major ring's Lp shape; defaults to 2.
 * @param options.minorLpExponent Exponent for the tube cross-section's Lp shape; defaults to 2.
 * @returns the VertexData of the torus
 */
export function CreateTorusVertexData(options: {
    diameter?: number;
    thickness?: number;
    tessellation?: number;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
    majorLpExponent?: number;
    minorLpExponent?: number;
}): VertexData {
    const indices: number[] = [];
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const diameter = options.diameter ?? 1;
    const thickness = options.thickness ?? 0.5;
    const tessellation = (options.tessellation ?? 16) | 0;
    const sideOrientation = options.sideOrientation === 0 ? 0 : (options.sideOrientation ?? VertexData.DEFAULTSIDE);
    const majorLpExponent = options.majorLpExponent ?? 2;
    const minorLpExponent = options.minorLpExponent ?? 2;

    const stride = tessellation + 1;
    const majorRadius = diameter / 2;
    const minorRadius = thickness / 2;

    for (let i = 0; i <= tessellation; i++) {
        const u = i / tessellation;

        const outerAngle = (i * Math.PI * 2.0) / tessellation - Math.PI / 2.0;

        const majorPoint = computeLpCirclePoint(outerAngle, majorRadius, majorLpExponent);
        const centerX = majorPoint.x;
        const centerZ = majorPoint.y;
        const centerLengthSquared = centerX * centerX + centerZ * centerZ;
        let radialX = 1;
        let radialZ = 0;

        if (centerLengthSquared > 1e-6) {
            const invLength = 1 / Math.sqrt(centerLengthSquared);
            radialX = centerX * invLength;
            radialZ = centerZ * invLength;
        }

        for (let j = 0; j <= tessellation; j++) {
            const v = 1 - j / tessellation;

            const innerAngle = (j * Math.PI * 2.0) / tessellation + Math.PI;
            const minorPoint = computeLpCirclePoint(innerAngle, minorRadius, minorLpExponent);
            const positionX = centerX + radialX * minorPoint.x;
            const positionY = minorPoint.y;
            const positionZ = centerZ + radialZ * minorPoint.x;

            positions.push(positionX, positionY, positionZ);
            uvs.push(u, v);

            // And create indices for two triangles.
            const nextI = (i + 1) % stride;
            const nextJ = (j + 1) % stride;

            indices.push(i * stride + j);
            indices.push(i * stride + nextJ);
            indices.push(nextI * stride + j);

            indices.push(i * stride + nextJ);
            indices.push(nextI * stride + nextJ);
            indices.push(nextI * stride + j);
        }
    }

    VertexData.ComputeNormals(positions, indices, normals);

    // Sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    // Result
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}
