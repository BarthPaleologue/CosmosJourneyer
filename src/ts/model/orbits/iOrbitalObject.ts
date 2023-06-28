import { ITransformLike } from "../../controller/uberCore/transforms/ITransformLike";
import { BaseModel } from "../common";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../../view/postProcesses/postProcessTypes";

export interface ITransformable {
    transform: ITransformLike;
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

export interface IOrbitalObject extends ITransformable {
    /**
     * The depth of the body in the orbital tree
     */
    depth: number;

    parentObjects: IOrbitalObject[];

    model: BaseModel;

    computeNextOrbitalPosition(): Vector3;
}
