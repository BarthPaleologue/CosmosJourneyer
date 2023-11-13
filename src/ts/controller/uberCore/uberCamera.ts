import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

export class UberCamera extends FreeCamera {
    private inverseProjectionMatrix: Matrix;
    private inverseViewMatrix: Matrix;

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, position, scene);

        this.inverseProjectionMatrix = Matrix.Invert(this.getProjectionMatrix());
        this.inverseViewMatrix = Matrix.Invert(this.getViewMatrix());
    }

    getInverseProjectionMatrix(): Matrix {
        this.inverseProjectionMatrix = Matrix.Invert(this.getProjectionMatrix());
        return this.inverseProjectionMatrix;
    }

    getInverseViewMatrix(): Matrix {
        this.inverseViewMatrix = Matrix.Invert(this.getViewMatrix());
        return this.inverseViewMatrix;
    }

    forward(): Vector3 {
        return this.getDirection(new Vector3(0, 0, -1));
    }

    getAbsolutePosition(): Vector3 {
        this.computeWorldMatrix();
        return this.globalPosition;
    }
}
