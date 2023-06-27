import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { BaseModel } from "../models/common";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../postProcesses/postProcessTypes";

export interface ITransformable {
    transform: ITransformLike;
}

export interface BoundingSphere extends ITransformable {
    getBoundingRadius(): number;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    postProcesses: PostProcessType[];
}

export interface IOrbitalObject extends ITransformable {
    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    parentObjects: IOrbitalObject[];

    model: BaseModel;

    computeNextOrbitalPosition(): Vector3;
}
