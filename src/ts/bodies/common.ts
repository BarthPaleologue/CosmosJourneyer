import { Camera } from "@babylonjs/core/Cameras/camera";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { PostProcessType } from "../postProcesses/postProcessTypes";

export interface Common {
    computeCulling(camera: Camera): void;
}

export interface BoundingSphere extends Transformable {
    /**
     * Returns apparent radius of the celestial body (can be greater than the actual radius for example : ocean)
     */
    getBoundingRadius(): number;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    postProcesses: PostProcessType[];
}
