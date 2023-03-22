import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class LOCAL_DIRECTION {
    static readonly FORWARD = new Vector3(0, 0, 1);
    static readonly BACKWARD = new Vector3(0, 0, -1);
    static readonly UP = new Vector3(0, 1, 0);
    static readonly DOWN = new Vector3(0, -1, 0);
    static readonly RIGHT = new Vector3(1, 0, 0);
    static readonly LEFT = new Vector3(-1, 0, 0);
}