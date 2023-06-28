import { Vector3 } from "@babylonjs/core/Maths/math";

export interface Cullable {
    computeCulling(cameraPosition: Vector3): void;
}
