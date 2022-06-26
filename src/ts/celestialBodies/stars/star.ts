import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, Scene, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { IStarPhysicalProperties } from "../iPhysicalProperties";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";
import { normalRandom, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/math";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";

// TODO: implement RigidBody for star
export class Star extends AbstractBody {
    static RING_PROPORTION = 0.2;

    private readonly mesh: Mesh;
    private readonly material: StarMaterial;
    internalTime = 0;
    protected bodyType = BodyType.STAR;
    readonly physicalProperties: IStarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    constructor(name: string, radius: number, starSystemManager: StarSystemManager, scene: Scene, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, radius, starSystemManager, seed, parentBodies);

        starSystemManager.stars.push(this);

        this.physicalProperties = {
            //TODO: ne pas hardcoder
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,

            temperature: clamp(normalRandom(5778, 2000, this.rng), 4000, 10000)
        };

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: this._radius * 2, segments: 32 }, scene);
        starSystemManager.depthRenderer.getDepthMap().renderList!.push(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new StarMaterial(this, scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            volumetricLight: new VolumetricLightScatteringPostProcess(`${name}VolumetricLight`, 1, scene.activeCamera!, this.mesh, 100),
            rings: null
        };
        this.postProcesses.volumetricLight!.exposure = 0.26;
        this.postProcesses.volumetricLight!.decay = 0.95;

        if (uniformRandBool(Star.RING_PROPORTION, this.rng)) {
            let rings = this.createRings(this, scene);
            rings.settings.ringStart = normalRandom(3, 1, this.rng);
            rings.settings.ringEnd = normalRandom(7, 1, this.rng);
            rings.settings.ringOpacity = this.rng();
        }
    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        this.material.update();

        this.internalTime += deltaTime;
        this.internalTime %= 24 * 60 * 60; // prevent imprecision in shader material (noise offset)
    }
}
