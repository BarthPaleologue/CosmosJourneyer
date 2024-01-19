import { TransformNode } from "@babylonjs/core/Meshes";

export interface Transformable {
    getTransform(): TransformNode;

    dispose(): void;
}
