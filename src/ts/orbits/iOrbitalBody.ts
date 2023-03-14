import { ITransformLike } from "../uberCore/transforms/ITransformLike";
import { BodyDescriptor } from "../descriptors/common";

export interface ITransformable {
    transform: ITransformLike;
}

export interface IOrbitalBody extends ITransformable {
    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    parentBodies: IOrbitalBody[];

    descriptor: BodyDescriptor;
}
