import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { Assets } from "../controller/assets";
import { SpaceStationModel } from "../model/spacestationModel";
import { AbstractObject } from "./bodies/abstractObject";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PostProcessType } from "./postProcesses/postProcessTypes";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";

export class SpaceStation extends AbstractObject {
    readonly model: SpaceStationModel;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    readonly ringInstances: InstancedMesh[] = [];

    constructor(scene: Scene, parentBody?: AbstractObject) {
        super("spaceStation", scene, parentBody);
        //TODO: do not hardcode seed
        const seed = 1;

        this.model = new SpaceStationModel(seed, parentBody?.model);

        this.instance = Assets.CreateSpaceStationInstance();
        this.instance.parent = this.getTransform();

        for (const mesh of this.instance.getChildMeshes()) {
            if (mesh.name.includes("ring")) {
                this.ringInstances.push(mesh as InstancedMesh);
            }
        }

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
        this.getTransform().rotate(Axis.Y, this.model.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.OVERLAY);
    }

    public override getBoundingRadius(): number {
        return 2e3;
    }

    public override computeCulling(camera: Camera): void {
        const isVisible = isSizeOnScreenEnough(this, camera);
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
