import { getRgbFromTemperature } from "../../toolbox/specrend";
import { CelestialBody } from "../celestialBody";

import { Mesh, Vector3, ShaderMaterial, Space, Axis, Scene, Quaternion } from "@babylonjs/core";
import {CelestialBodyType, StarPhysicalProperties} from "../interfaces";

// TODO: implement RigidBody for star
export class Star extends CelestialBody {
    public mesh: Mesh;
    private readonly radius: number;
    private readonly starMaterial: ShaderMaterial;
    private internalTime = 0;
    protected bodyType = CelestialBodyType.STAR;
    physicalProperties: StarPhysicalProperties = {
        //TODO: ne pas hardcoder
        temperature: 5778
    };
    constructor(name: string, radius: number, scene: Scene) {
        super();
        this.mesh = Mesh.CreateSphere(name, 32, radius, scene);
        this.radius = radius;
        this.mesh.rotate(Axis.Y, 0, Space.WORLD); // init rotation quaternion
        let starMaterial = new ShaderMaterial("starColor", scene, "./shaders/starMaterial",
            {
                attributes: ["position"],
                uniforms: [
                    "world", "worldViewProjection", "planetWorldMatrix",
                    "starColor", "time"
                ]
            }
        );
        starMaterial.setMatrix("planetWorldMatrix", this.mesh.getWorldMatrix());
        starMaterial.setVector3("starColor", getRgbFromTemperature(this.physicalProperties.temperature));

        this.starMaterial = starMaterial;

        this.mesh.material = this.starMaterial;
    }

    setAbsolutePosition(newPosition: Vector3): void {
        this.mesh.setAbsolutePosition(newPosition);
    }

    getAbsolutePosition(): Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    update(observerPosition: Vector3, observerDirection: Vector3, lightPosition: Vector3): void {
        //TODO: update star
        this.starMaterial.setFloat("time", this.internalTime);
        this.internalTime += this.mesh.getEngine().getDeltaTime() / 1000;
    }

    getName(): string {
        return this.mesh.id;
    }

    public getRadius(): number {
        return this.radius;
    }

    getRotationQuaternion(): Quaternion {
        return this.mesh.rotationQuaternion!;
    }
}