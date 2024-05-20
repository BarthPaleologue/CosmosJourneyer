import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector2, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math";
import { CompatibilityOptions } from "@babylonjs/core/Compat/compatibilityOptions";

/**
 * Creates the VertexData for a helix
 * @param options an object used to set the following optional parameters for the helix, required but can be empty
 * * radius the radius of the helix, optional default 1
 * * tubeDiameter the diameter of the tube forming the helix, optional default 0.1
 * * tessellation the number of sides for the tube, optional default 24
 * * spires the number of spires in the helix, optional default 5
 * * pitch the distance between successive turns of the helix, optional default 1
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @param options.radius
 * @param options.tubeDiameter
 * @param options.tessellation
 * @param options.spires
 * @param options.pitch
 * @param options.sideOrientation
 * @param options.frontUVs
 * @param options.backUVs
 * @returns the VertexData of the helix
 */
export function createHelixVertexData(options: { radius?: number; tubeDiameter?: number; tessellation?: number; spires?: number; pitch?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 }) {
    const indices = [];
    const positions = [];
    const normals = [];
    const uvs = [];

    const radius = options.radius || 1;
    const tubeDiameter = options.tubeDiameter || 0.1;
    const tessellation = (options.tessellation || 24) | 0;
    const spires = options.spires || 5;
    const pitch = options.pitch || 1;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    const turns = spires * tessellation;

    for (let i = 0; i <= turns; i++) {
        const u = i / tessellation;

        const angle = (i * Math.PI * 2.0) / tessellation - Math.PI / 2.0;
        const y = (i * pitch) / tessellation;

        const transform = Matrix.Translation(radius, y - spires * pitch / 2, 0).multiply(Matrix.RotationY(angle));

        for (let j = 0; j <= tessellation; j++) {
            const v = 1 - j / tessellation;

            const innerAngle = (j * Math.PI * 2.0) / tessellation + Math.PI;
            const dx = Math.cos(innerAngle);
            const dy = Math.sin(innerAngle);

            // Create a vertex.
            let normal = new Vector3(dx, dy, 0);
            let position = normal.scale(tubeDiameter / 2);
            const textureCoordinate = new Vector2(u, v);

            position = Vector3.TransformCoordinates(position, transform);
            normal = Vector3.TransformNormal(normal, transform);

            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - textureCoordinate.y : textureCoordinate.y);
        }
    }

    for (let i = 0; i < turns; i++) {
        for (let j = 0; j < tessellation; j++) {
            const first = (i * (tessellation + 1)) + j;
            const second = first + tessellation + 1;

            indices.push(first);
            indices.push(first + 1);
            indices.push(second);

            indices.push(second);
            indices.push(first + 1);
            indices.push(second + 1);
        }
    }

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

/**
 * Creates a helix mesh
 * * The parameter `radius` sets the radius of the helix (default 1)
 * * The parameter `tubeDiameter` sets the diameter size of the tube of the helix (float, default 0.1)
 * * The parameter `tessellation` sets the number of sides for the tube (positive integer, default 24)
 * * The parameter `spires` sets the number of spires in the helix (positive integer, default 5)
 * * The parameter `pitch` sets the distance between successive turns of the helix (float, default 1)
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param options.radius
 * @param options.tubeDiameter
 * @param options.tessellation
 * @param options.spires
 * @param options.pitch
 * @param options.updatable
 * @param options.sideOrientation
 * @param options.frontUVs
 * @param options.backUVs
 * @param scene defines the hosting scene
 * @returns the helix mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#helix
 */
export function createHelix(
    name: string,
    options: { radius?: number; tubeDiameter?: number; tessellation?: number; spires?: number; pitch?: number; updatable?: boolean; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 } = {},
    scene?: Scene
): Mesh {
    const helix = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    helix._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = createHelixVertexData(options);

    vertexData.applyToMesh(helix, options.updatable);

    return helix;
}