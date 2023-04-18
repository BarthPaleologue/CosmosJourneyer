import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface Thruster {
    getThrottle(): number;

    getAuthority(direction: Vector3): number;
}