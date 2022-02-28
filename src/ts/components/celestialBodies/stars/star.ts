import {BodyPhysicalProperties, CelestialBody, CelestialBodyType} from "../celestialBody";

export interface StarPhysicalProperties extends BodyPhysicalProperties {
    temperature: number
}

export class Star extends CelestialBody {
    public mesh: BABYLON.Mesh;
    private radius: number
    protected bodyType = CelestialBodyType.STAR;
    physicalProperties: StarPhysicalProperties = {
        temperature: 5772
    }
    constructor(name: string, radius: number, scene: BABYLON.Scene) {
        super();
        this.mesh = BABYLON.Mesh.CreateSphere(name, 32, radius, scene);
        this.radius = radius;
        this.mesh.rotate(BABYLON.Axis.Y, 0, BABYLON.Space.WORLD); // init rotation quaternion
        let starMaterial = new BABYLON.ShaderMaterial("starColor", scene, "./shaders/starMaterial",
            {
                attributes: ["position"],
                uniforms: [
                    "world", "worldViewProjection", "planetWorldMatrix",
                ]
            }
        );
        starMaterial.setMatrix("planetWorldMatrix", this.mesh.getWorldMatrix());

        this.mesh.material = starMaterial;
    }

    setAbsolutePosition(newPosition: BABYLON.Vector3): void {
        this.mesh.setAbsolutePosition(newPosition);
    }

    getAbsolutePosition(): BABYLON.Vector3 {
        return this.mesh.getAbsolutePosition();
    }

    update(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3): void {
        //TODO: update star
    }

    getName(): string {
        return this.mesh.id;
    }

    public getRadius(): number {
        return this.radius;
    }

    getRotationQuaternion(): BABYLON.Quaternion {
        return this.mesh.rotationQuaternion!;
    }
}