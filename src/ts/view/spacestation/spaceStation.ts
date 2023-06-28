import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { Assets } from "../../controller/assets";
import { SpaceStationModel } from "../../model/spacestationModel";
import { AbstractObject } from "../bodies/abstractObject";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Settings } from "../../settings";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";

export class SpaceStation extends AbstractObject {
    readonly model: SpaceStationModel;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    readonly ringInstances: InstancedMesh[] = [];

    constructor(parentBodies: AbstractObject[], scene: Scene) {
        super("spaceStation", parentBodies, scene);
        //TODO: do not hardcode seed
        const seed = 1;

        this.model = new SpaceStationModel(
            seed,
            parentBodies.map((body) => body.model)
        );

        this.instance = Assets.CreateSpaceStationInstance();
        this.instance.parent = this.transform.node;

        for (const mesh of this.instance.getChildMeshes()) {
            if (mesh.name.includes("ring")) {
                this.ringInstances.push(mesh as InstancedMesh);
            }
        }

        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);
        this.transform.rotate(Axis.Y, this.model.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.OVERLAY);
    }

    public override getBoundingRadius(): number {
        return 2e3;
    }

    public override computeCulling(cameraPosition: Vector3): void {
        const isVisible = isSizeOnScreenEnough(this, cameraPosition);
        for (const mesh of this.instance.getChildMeshes()) {
            mesh.isVisible = isVisible;
        }
    }

    public override updateRotation(deltaTime: number): number {
        const dtheta = deltaTime / this.model.physicalProperties.rotationPeriod;

        if (this.ringInstances.length === 0) this.instance.rotate(Axis.Z, dtheta);
        else {
            for (const ring of this.ringInstances) {
                ring.rotate(Axis.Y, dtheta);
            }
        }
        return dtheta;
    }

    public override dispose(): void {
        this.instance.dispose();
    }
}
