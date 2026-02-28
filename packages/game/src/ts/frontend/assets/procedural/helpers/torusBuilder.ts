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
 * @param options an object used to set the following optional parameters for the box, required but can be empty
 * * diameter the diameter of the torus, optional default 1
 * * thickness the diameter of the tube forming the torus, optional default 0.5
 * * tessellation the number of prism sides, 3 for a triangular prism, optional, default 24
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * * majorLpExponent exponent used to shape the major circle using an Lp (Minkowski) norm, optional default 2
 * * minorLpExponent exponent used to shape the minor circle using an Lp (Minkowski) norm, optional default 2
 * @param options.diameter
 * @param options.thickness
 * @param options.tessellation
 * @param options.sideOrientation
 * @param options.frontUVs
 * @param options.backUVs
 * @param options.majorLpExponent
 * @param options.minorLpExponent
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
}) {
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
