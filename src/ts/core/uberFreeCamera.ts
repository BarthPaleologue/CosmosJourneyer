import { FreeCamera, Matrix, Vector3 } from "@babylonjs/core";

export class UberFreeCamera extends FreeCamera {
    private inverseProjectionMatrix: Matrix;
    private inverseViewMatrix: Matrix;

    constructor(name: string, position: Vector3) {
        super(name, position);

        this.inverseProjectionMatrix = Matrix.Invert(this.getProjectionMatrix());
        this.inverseViewMatrix = Matrix.Invert(this.getViewMatrix());

        this.onViewMatrixChangedObservable.add(() => {
            this.inverseViewMatrix = Matrix.Invert(this.getViewMatrix());
        });

        this.onProjectionMatrixChangedObservable.add(() => {
            this.inverseProjectionMatrix = Matrix.Invert(this.getProjectionMatrix());
        });
    }

    getInverseProjectionMatrix(): Matrix {
        return this.inverseProjectionMatrix;
    }

    getInverseViewMatrix(): Matrix {
        return this.inverseViewMatrix;
    }
}
