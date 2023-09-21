import { AbstractBody } from "../abstractBody";
import { BlackHoleModel } from "../../../model/stellarObjects/blackHoleModel";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";
import { PostProcessType } from "../../postProcesses/postProcessTypes";

export class BlackHole extends AbstractBody {
    readonly light: PointLight;

    readonly model: BlackHoleModel;

    constructor(name: string, scene: Scene, model: BlackHoleModel | number, parentBody?: AbstractBody) {
        super(name, scene, parentBody);

        this.model = model instanceof BlackHoleModel ? model : new BlackHoleModel(model);

        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.transform;
        if (this.model.physicalProperties.accretionDiskRadius === 0) this.light.intensity = 0;

        this.postProcesses.push(PostProcessType.OVERLAY, PostProcessType.BLACK_HOLE);
    }

    public override computeCulling(cameraPosition: Vector3): void {
        // nothing to do
    }

    public override dispose(): void {
        this.light.dispose();
        super.dispose();
    }
}
