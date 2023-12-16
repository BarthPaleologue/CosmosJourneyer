import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { BaseObject } from "../bodies/common";
import { Transformable } from "../uberCore/transforms/basicTransform";

export interface UpdatablePostProcess extends PostProcess {
    /**
     * Updates the post process internal clock so that time-dependent effects can be updated.
     * @param deltaTime The time in seconds since the last update
     */
    update(deltaTime: number): void;
}

export interface ObjectPostProcess extends PostProcess {
    /**
     * The object this post process will be attached to.
     * This makes sense for raymarching and raytracing shaders that need to know the position of the object.
     */
    readonly object: Transformable;
    dispose(): void;
}
