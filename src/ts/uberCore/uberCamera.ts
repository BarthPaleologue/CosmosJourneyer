import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

export class UberCamera extends FreeCamera {

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);
    }

    forward(): Vector3 {
        return this.getDirection(new Vector3(0, 0, -1));
    }

    getAbsolutePosition(): Vector3 {
        this.computeWorldMatrix();
        return this.globalPosition;
    }
}
