import { BaseModel } from "../common";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../../view/postProcesses/postProcessTypes";
import { TransformNode } from "@babylonjs/core/Meshes";

export interface ITransformable {
    transform: TransformNode;
}

export interface BoundingSphere extends ITransformable {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    postProcesses: PostProcessType[];
}

export interface OrbitalObject extends ITransformable {
    parentObject: OrbitalObject | null;

    model: BaseModel;

    computeNextOrbitalPosition(): Vector3;
}
