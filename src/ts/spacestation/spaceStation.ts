import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { Assets } from "../assets";
import { SpaceStationDescriptor } from "../descriptors/spacestationDescriptor";
import { AbstractObject } from "../bodies/abstractObject";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Settings } from "../settings";
import { isObjectVisibleOnScreen } from "../utils/isObjectVisibleOnScreen";

export class SpaceStation extends AbstractObject {
    readonly descriptor: SpaceStationDescriptor;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    constructor(parentBodies: AbstractObject[], scene: Scene) {
        super("spaceStation", parentBodies, scene);
        //TODO: do not hardcode seed
        const seed = 1;

        this.descriptor = new SpaceStationDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.instance = Assets.CreateSpaceStationInstance();
        this.instance.parent = this.transform.node;

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);
        this.transform.rotate(Axis.Z, this.descriptor.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.OVERLAY);
    }

    public override getBoundingRadius(): number {
        return 2e3;
    }

    public override computeCulling(cameraPosition: Vector3): void {
        const isVisible = isObjectVisibleOnScreen(this, cameraPosition);
        for (const mesh of this.instance.getChildMeshes()) { mesh.isVisible = isVisible; }
    }

    public override dispose(): void {
        this.instance.dispose();
    }
}
