import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { BlackHoleModel } from "./blackHoleModel";
import { StellarObject } from "../../architecture/stellarObject";
import { Cullable } from "../../bodies/cullable";
import { CelestialBody, HasCelestialBodyModel } from "../../architecture/celestialBody";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";

export class BlackHole implements StellarObject, Cullable {
    readonly name: string;

    private readonly transform: TransformNode;

    readonly light: PointLight;

    readonly model: BlackHoleModel;

    readonly postProcesses: PostProcessType[] = [];

    readonly parent: (CelestialBody & HasCelestialBodyModel) | null;

    constructor(name: string, scene: Scene, model: BlackHoleModel | number, parentBody: (CelestialBody & HasCelestialBodyModel) | null = null) {
        this.name = name;

        this.model = model instanceof BlackHoleModel ? model : new BlackHoleModel(model);

        this.parent = parentBody;

        this.transform = new TransformNode(`${name}Transform`, scene);
        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();
        if (this.model.physicalProperties.accretionDiskRadius === 0) this.light.intensity = 0;

        this.postProcesses.push(PostProcessType.BLACK_HOLE);
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getLight(): PointLight {
        return this.light;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    getRingsUniforms(): RingsUniforms | null {
        return null;
    }

    getTypeName(): string {
        return "Black Hole";
    }

    public computeCulling(camera: Camera): void {
        return;
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius() + this.model.physicalProperties.accretionDiskRadius;
    }

    public dispose(): void {
        this.light.dispose();
        this.transform.dispose();
    }
}
