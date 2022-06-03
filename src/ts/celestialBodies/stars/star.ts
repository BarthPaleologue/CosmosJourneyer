import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, Quaternion, Scene, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { StarPhysicalProperties } from "../physicalPropertiesInterfaces";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";

// TODO: implement RigidBody for star
export class Star extends AbstractBody {
    private readonly mesh: Mesh;
    private readonly radius: number;
    private readonly material: StarMaterial;
    internalTime = 0;
    protected bodyType = BodyType.STAR;
    readonly physicalProperties: StarPhysicalProperties;

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

            temperature: 5778
        }
    ) {
        super(name, starSystemManager);
        this.physicalProperties = physicalProperties;
        this.radius = radius;

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: this.radius, segments: 32 }, scene);
        this.mesh.parent = this.transform;

        this.material = new StarMaterial(this, scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            volumetricLight: new VolumetricLightScatteringPostProcess(`${name}VolumetricLight`, 1, scene.activeCamera!, this.mesh, 100)
        };
        this.postProcesses.volumetricLight!.exposure = 1.0;
        this.postProcesses.volumetricLight!.decay = 0.95;
    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        this.material.update();

        this.internalTime += deltaTime;
        this.internalTime %= 24 * 60 * 60; // prevent imprecision in shader material (noise offset)
    }

    public getRadius(): number {
        return this.radius;
    }
}
