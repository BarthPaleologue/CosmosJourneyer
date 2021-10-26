import { Vector3 } from "./algebra";

export class Transform {
    private position: Vector3;
    private rotation: Vector3;
    constructor(position: Vector3, rotation: Vector3) {
        this.position = position;
        this.rotation = rotation;
    }
    public getPosition(): Vector3 {
        return this.position;
    }
    public getRotation(): Vector3 {
        return this.rotation;
    }
}