import { DepthRenderer, FreeCamera, Matrix, Vector3 } from "@babylonjs/core";
import { UberScene } from "./uberScene";

export class UberFreeCamera extends FreeCamera {
    readonly depthRenderer: DepthRenderer;
    private inverseProjectionMatrix: Matrix;
    private inverseViewMatrix: Matrix;

    constructor(name: string, position: Vector3, scene: UberScene) {
        super(name, position, scene);
        this.depthRenderer = scene.enableDepthRenderer(this, false, true);
        scene.customRenderTargets.push(this.depthRenderer.getDepthMap());

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
