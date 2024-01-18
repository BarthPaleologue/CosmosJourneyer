import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Scene } from "@babylonjs/core/scene";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { SpaceStationModel } from "./spacestationModel";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Assets } from "../assets";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Cullable } from "../bodies/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../orbit/orbitProperties";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";

export class SpaceStation implements OrbitalObject, Cullable {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly postProcesses: PostProcessType[] = [];

    readonly instance: InstancedMesh;

    readonly ringInstances: InstancedMesh[] = [];

    readonly parent: OrbitalObject | null = null;

    constructor(scene: Scene, parentBody: OrbitalObject | null = null) {
        //TODO: do not hardcode name
        this.name = "Spacestation";

        //TODO: do not hardcode seed
        const seed = 1;

        this.model = new SpaceStationModel(seed, parentBody?.model);

        this.parent = parentBody;

        this.instance = Assets.CreateSpaceStationInstance();
        this.instance.parent = this.getTransform();

        for (const mesh of this.instance.getChildMeshes()) {
            if (mesh.name.includes("ring")) {
                this.ringInstances.push(mesh as InstancedMesh);
            }
        }

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
        this.getTransform().rotate(Axis.Y, this.model.physicalProperties.axialTilt);
    }

    getTransform(): TransformNode {
        return this.instance;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    public getBoundingRadius(): number {
        return 1e3;
    }

    getTypeName(): string {
        return "Space Station";
    }

    public computeCulling(camera: Camera): void {
        const isVisible = isSizeOnScreenEnough(this, camera);
        for (const mesh of this.instance.getChildMeshes()) {
            mesh.isVisible = isVisible;
        }
    }

    public updateRotation(deltaTime: number): number {
        const dtheta = deltaTime / this.model.physicalProperties.rotationPeriod;

        if (this.ringInstances.length === 0) this.instance.rotate(Axis.Z, dtheta);
        else {
            for (const ring of this.ringInstances) {
                ring.rotate(Axis.Y, dtheta);
            }
        }
        return dtheta;
    }

    public dispose(): void {
        this.instance.dispose();
    }
}
