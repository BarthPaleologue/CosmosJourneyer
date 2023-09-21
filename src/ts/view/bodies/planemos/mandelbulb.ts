import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../../controller/uberCore/uberScene";
import { Planemo } from "./planemo";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MandelbulbModel } from "../../../model/planemos/mandelbulbModel";

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

        this.model =
            model instanceof MandelbulbModel
                ? model
                : new MandelbulbModel(
                      model,
                      parentBody?.model
                  );

        this.postProcesses.push(PostProcessType.OVERLAY, PostProcessType.MANDELBULB);

        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    public override computeCulling(cameraPosition: Vector3): void {
        // do nothing
    }
}
