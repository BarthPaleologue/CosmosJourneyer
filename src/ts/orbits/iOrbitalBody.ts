import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { BaseDescriptor } from "../descriptors/common";
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

export interface IOrbitalBody extends ITransformable {
    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    parentObjects: IOrbitalBody[];

    descriptor: BaseDescriptor;

    computeNextOrbitalPosition(): Vector3;
}
