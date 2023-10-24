import { Vector3 } from "@babylonjs/core/Maths/math";
import { BaseModel } from "../model/common";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { TransformNode } from "@babylonjs/core/Meshes";

export interface OrbitalObject extends ITransformable {
    parentObject: OrbitalObject | null;

    model: BaseModel;

    updateOrbitalPosition(): void;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    postProcesses: PostProcessType[];
}

export interface ITransformable {
    transform: TransformNode;
}

export interface BoundingSphere extends ITransformable {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}
