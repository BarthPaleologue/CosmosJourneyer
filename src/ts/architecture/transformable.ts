import { TransformNode } from "@babylonjs/core/Meshes";

/**
 * Describes all objects that can be moved around, rotated and scaled in the scene
 */
export interface Transformable {
    /**
     * Returns the transform node of the Transformable object
     */
    getTransform(): TransformNode;

    /**
     * Deletes all resources used by the Transformable object
     */
    dispose(): void;
}
