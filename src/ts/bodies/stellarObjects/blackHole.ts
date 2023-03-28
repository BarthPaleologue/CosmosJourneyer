import { AbstractBody } from "../abstractBody";
import { BlackHolePostProcesses } from "../common";
import { BlackHoleDescriptor } from "../../descriptors/stellarObjects/blackHoleDescriptor";
import { IOrbitalProperties } from "../../orbits/iOrbitalProperties";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";

export class BlackHole extends AbstractBody {
    readonly orbitalProperties: IOrbitalProperties;
    readonly postProcesses: BlackHolePostProcesses;

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

        this.orbitalProperties = this.descriptor.orbitalProperties;

        this.postProcesses = {
            rings: false,
            overlay: true,
            blackHole: true
        };
    }

    public override dispose(): void {
        this.light.dispose();
        super.dispose();
    }
}
