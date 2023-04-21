import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { DirectionnalParticleSystem } from "../utils/particleSystem";
import { NewtonianTransform } from "../uberCore/transforms/newtonianTransform";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

export interface Thruster {
    readonly mesh: AbstractMesh;

    readonly maxAuthority: number;

    readonly plume: DirectionnalParticleSystem;

    readonly parent: NewtonianTransform;

    getThrottle(): number;

    getAuthority(direction: Vector3): number;

    /**
     * Returns the authority of the thruster in the given direction
     * @param direction The direction (in local space)
     * @returns
     */
    getAuthority(direction: Vector3): number;

    /**
     * Returns the theoretical authority of the thruster in the given direction between 0 and 1 (independent of throttle)
     * @param direction The direction (in local space)
     * @returns
     */
    getAuthority01(direction: Vector3): number;
}
