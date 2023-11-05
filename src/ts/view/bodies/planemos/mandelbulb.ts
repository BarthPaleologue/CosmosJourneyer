import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../../controller/uberCore/uberScene";
import { Planemo } from "./planemo";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { MandelbulbModel } from "../../../model/planemos/mandelbulbModel";
import { Camera } from "@babylonjs/core/Cameras/camera";

export class Mandelbulb extends AbstractBody implements Planemo {
    readonly model: MandelbulbModel;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: UberScene, model: MandelbulbModel | number, parentBody?: AbstractBody) {
        super(name, scene, parentBody);

        this.model = model instanceof MandelbulbModel ? model : new MandelbulbModel(model, parentBody?.model);

        this.postProcesses.push(PostProcessType.MANDELBULB);

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    getTypeName(): string {
        return "Anomaly";
    }

    public override computeCulling(camera: Camera): void {
        // do nothing
    }
}
