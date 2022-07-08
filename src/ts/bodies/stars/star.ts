import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, Texture, Vector3, VolumetricLightScatteringPostProcess } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { IStarPhysicalProperties } from "../iPhysicalProperties";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/math";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { Settings } from "../../settings";

// TODO: implement RigidBody for star
export class Star extends AbstractBody {
    static RING_PROPORTION = 0.2;

    private readonly mesh: Mesh;
    private readonly material: StarMaterial;

    internalTime = 0;

    override readonly bodyType = BodyType.STAR;
    override readonly physicalProperties: IStarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    override readonly radius;

    constructor(name: string, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng) * Settings.EARTH_RADIUS;

        starSystemManager.stars.push(this);

        this.physicalProperties = {
            //TODO: do not hardcode
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,

            temperature: clamp(normalRandom(5778, 2000, this.rng), 4000, 10000)
        };

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: this.radius * 2, segments: 32 }, starSystemManager.scene);
        starSystemManager.registerMeshDepth(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new StarMaterial(this, starSystemManager.scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            volumetricLight: new VolumetricLightScatteringPostProcess(
                `${name}VolumetricLight`,
                1,
                starSystemManager.scene.activeCamera!,
                this.mesh,
                100,
                Texture.BILINEAR_SAMPLINGMODE,
                starSystemManager.scene.getEngine()
            ),
            rings: null
        };
        this.postProcesses.volumetricLight.exposure = 0.26;
        this.postProcesses.volumetricLight.decay = 0.95;
        this.postProcesses.volumetricLight.getCamera().detachPostProcess(this.postProcesses.volumetricLight);

        for (const pipeline of starSystemManager.pipelines) {
            pipeline.volumetricLights.push(this.postProcesses.volumetricLight);
        }

        if (uniformRandBool(Star.RING_PROPORTION, this.rng)) {
            const rings = this.createRings(this, starSystemManager.scene);
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
