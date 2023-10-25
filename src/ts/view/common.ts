import { BaseModel } from "../model/common";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TransformNode } from "@babylonjs/core/Meshes";

export interface OrbitalObject extends Transformable {
    parentObject: OrbitalObject | null;

    model: BaseModel;

    updateOrbitalPosition(deltaTime: number): void;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    postProcesses: PostProcessType[];
}

export interface Transformable {
    getTransform(): TransformNode;
}

export interface BoundingSphere extends Transformable {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}
