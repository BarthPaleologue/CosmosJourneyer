import {getRgbFromTemperature} from "../../utils/specrend";
import {CelestialBody} from "../celestialBody";

import {Axis, Mesh, Quaternion, Scene, ShaderMaterial, Space, Vector3} from "@babylonjs/core";
import {CelestialBodyType, StarPhysicalProperties} from "../interfaces";
import {initMeshTransform} from "../../utils/mesh";

// TODO: implement RigidBody for star
export class Star extends CelestialBody {
    public mesh: Mesh;
    private readonly radius: number;
    private readonly starMaterial: ShaderMaterial;
    private internalTime = 0;
    protected bodyType = CelestialBodyType.STAR;
    physicalProperties: StarPhysicalProperties;
    constructor(name: string, radius: number, position: Vector3, scene: Scene, physicalProperties: StarPhysicalProperties = {
        //TODO: ne pas hardcoder
        rotationPeriod: 60 * 60,
        rotationAxis: Axis.Y,

        temperature: 5778
    }) {
        super();
        this.physicalProperties = physicalProperties;
        this.radius = radius;

        this.mesh = Mesh.CreateSphere(name, 32, this.radius, scene);
        this.mesh.setAbsolutePosition(position);
        initMeshTransform(this.mesh);

        let starMaterial = new ShaderMaterial("starColor", scene, "./shaders/starMaterial",
            {
                attributes: ["position"],
                uniforms: [
                    "world", "worldViewProjection", "planetWorldMatrix",
                    "starColor", "time"
                ]
            }
        );

        this.starMaterial = starMaterial;

        this.mesh.material = this.starMaterial;
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.mesh.setAbsolutePosition(newPosition);
    }

    public getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    public translate(displacement: Vector3): void {
        this.mesh.position.addInPlace(displacement);
    }
    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.mesh.rotateAround(pivot, axis, amount);
    }
    public rotate(axis: Vector3, amount: number) {
        this.mesh.rotate(axis, amount, Space.WORLD);
        this.physicalProperties.rotationAxis = this.mesh.up;
    }

    public update(observerPosition: Vector3, observerDirection: Vector3, lightPosition: Vector3): void {
        this.mesh.rotate(this.physicalProperties.rotationAxis, this.mesh.getEngine().getDeltaTime() / (1000 * this.physicalProperties.rotationPeriod));

        this.starMaterial.setFloat("time", this.internalTime);
        this.starMaterial.setVector3("starColor", getRgbFromTemperature(this.physicalProperties.temperature));
        this.starMaterial.setMatrix("planetWorldMatrix", this.mesh.getWorldMatrix());

        this.internalTime += this.mesh.getEngine().getDeltaTime() / 1000;
    }

    public getName(): string {
        return this.mesh.id;
    }

    public getRadius(): number {
        return this.radius;
    }

    public getRotationQuaternion(): Quaternion {
        return this.mesh.rotationQuaternion!;
    }
}