import { Axis, Mesh, Space } from "@babylonjs/core";

/**
 * Aims at fixing the weirdness of babylonjs (properties not defined until called)
 * @param mesh the mesh to init
 */
export function initMeshTransform(mesh: Mesh) {
    mesh.position;
    mesh.rotate(Axis.Y, 0, Space.WORLD); // init rotation quaternion
    mesh.up; // init up vector
}
