import { getRgbFromTemperature } from "../../utils/specrend";
import { CelestialBody } from "../celestialBody";

import { Axis, Mesh, MeshBuilder, Quaternion, Scene, ShaderMaterial, Space, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { CelestialBodyType } from "../interfaces";
import { initMeshTransform } from "../../utils/mesh";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { StarPhysicalProperties } from "../physicalPropertiesInterfaces";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";

// TODO: implement RigidBody for star
export class Star extends CelestialBody {
    public mesh: Mesh;
    private readonly radius: number;
    private readonly material: StarMaterial;
    internalTime = 0;
    protected bodyType = CelestialBodyType.STAR;
    physicalProperties: StarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    constructor(
        name: string,
        radius: number,
        starSystemManager: StarSystemManager,
        scene: Scene,
        physicalProperties: StarPhysicalProperties = {
            //TODO: ne pas hardcoder
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,
            rotationAxis: Axis.Y,

            temperature: 5778
        }
    ) {
        super(name, starSystemManager);
        this.physicalProperties = physicalProperties;
        this.radius = radius;

        this.mesh = MeshBuilder.CreateSphere(name, { diameter: this.radius, segments: 32 }, scene);

        initMeshTransform(this.mesh);

        this.material = new StarMaterial(this, scene);

        this.mesh.material = this.material;

        this.postProcesses = {
            volumetricLight: new VolumetricLightScatteringPostProcess(`${name}VolumetricLight`, 1, scene.activeCamera!, this.mesh, 100)
        };
        this.postProcesses.volumetricLight!.exposure = 1.0;
        this.postProcesses.volumetricLight!.decay = 0.95;
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.mesh.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        if (this.mesh.getAbsolutePosition()._isDirty) this.mesh.computeWorldMatrix(true);
        return this.mesh.getAbsolutePosition();
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.mesh.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number) {
        this.mesh.rotate(axis, amount, Space.WORLD);
        super.rotate(axis, amount);
    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        this.material.update();

        this.internalTime += deltaTime;
        this.internalTime %= 24 * 60 * 60; // prevent imprecision in shader material (noise offset)
    }

    public getRadius(): number {
        return this.radius;
    }

    public getRotationQuaternion(): Quaternion {
        if (this.mesh.rotationQuaternion == undefined) throw new Error(`${this.getName()}'s rotation quaternion is null !`);
        if (this.mesh.rotationQuaternion._isDirty) this.mesh.computeWorldMatrix(true);
        return this.mesh.rotationQuaternion;
    }
}
