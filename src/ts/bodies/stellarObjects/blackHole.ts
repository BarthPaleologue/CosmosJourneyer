import { AbstractBody } from "../abstractBody";
import { BlackHoleDescriptor } from "../../descriptors/stellarObjects/blackHoleDescriptor";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";
import { PostProcessType } from "../../postProcesses/postProcessTypes";

export class BlackHole extends AbstractBody {
    readonly postProcesses: PostProcessType[] = [];

    readonly light: PointLight;

    readonly descriptor: BlackHoleDescriptor;

    constructor(name: string, seed: number, parentBodies: AbstractBody[], scene: Scene) {
        super(name, parentBodies, scene);

        this.descriptor = new BlackHoleDescriptor(seed);

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.descriptor.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.transform.node;
        if (this.descriptor.physicalProperties.accretionDiskRadius === 0) this.light.intensity = 0;

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
