import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { BaseDescriptor } from "../descriptors/common";
import { Vector3 } from "@babylonjs/core/Maths/math";

export interface ITransformable {
    transform: ITransformLike;
}

export interface IOrbitalBody extends ITransformable {
    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    parentBodies: IOrbitalBody[];

    descriptor: BaseDescriptor;

    computeNextOrbitalPosition(): Vector3;
}
