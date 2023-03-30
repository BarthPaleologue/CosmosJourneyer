import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransferCollisionData } from "../chunks/workerDataTypes";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../utils/boundingSphere";

/**
 * Describes object that can be collided with
 */
export interface RigidBody {
    /**
     * Creates a task to check if the given position overlaps with the terrain of the planet
     * @param relativePosition The relative position to the planet
     */
    generateCollisionTask(relativePosition: Vector3): TransferCollisionData;
}

export interface BaseObject extends BoundingSphere {
    name: string;
    transform: BasicTransform;
    postProcesses: BasePostProcesses;
}

export type BasePostProcesses = {
    overlay: boolean;
};

export type BodyPostProcesses = BasePostProcesses & {
    rings: boolean;
};

export type PlanetPostProcesses = BodyPostProcesses & {
    atmosphere: boolean;
};

export type TelluricPlanetPostProcesses = PlanetPostProcesses & {
    ocean: boolean;
    clouds: boolean;
};

export type StarPostProcesses = BodyPostProcesses & {
    volumetricLight: boolean;
};

export type BlackHolePostProcesses = BodyPostProcesses & {
    blackHole: boolean;
};
