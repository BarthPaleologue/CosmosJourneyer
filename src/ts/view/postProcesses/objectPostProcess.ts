import { BaseObject } from "../common";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";

export interface UpdatablePostProcess extends PostProcess {
    update(deltaTime: number): void;
}

export interface ObjectPostProcess extends UpdatablePostProcess {
    readonly object: BaseObject;
    dispose(): void;
}
