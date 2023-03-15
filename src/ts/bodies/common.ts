import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransferCollisionData } from "../chunks/workerDataTypes";

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

export type BodyPostProcesses = {
    rings: boolean;
    overlay: boolean;
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
