import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { Assets } from "../assets";
import { BasePostProcesses } from "../bodies/common";
import { SpaceStationDescriptor } from "../descriptors/spacestationDescriptor";
import { AbstractObject } from "../bodies/abstractObject";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export class SpaceStation extends AbstractObject {
    readonly descriptor: SpaceStationDescriptor;

    readonly postProcesses: BasePostProcesses;

    readonly instance: InstancedMesh;

    constructor(parentBodies: AbstractObject[], scene: Scene) {
        super("spaceStation", parentBodies, scene);
        //TODO: do not hardcode seed
        const seed = 1;

        this.descriptor = new SpaceStationDescriptor(seed, parentBodies.map(body => body.descriptor));

        this.instance = Assets.CreateSpaceStationInstance();
        this.instance.parent = this.transform.node;

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);
        this.transform.rotate(Axis.Z, this.descriptor.physicalProperties.axialTilt);

        this.postProcesses = {
            overlay: true
        };
    }

    getBoundingRadius(): number {
        return 2e3;
    }

    public dispose(): void {
        this.instance.dispose();
    }
}