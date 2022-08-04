import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystem } from "../starSystem";
import { StarPhysicalProperties } from "../physicalProperties";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/gradientMath";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { Settings } from "../../settings";
import { VolumetricLight } from "../../postProcesses/volumetricLight";

// TODO: implement RigidBody for star
export class Star extends AbstractBody {
    static RING_PROPORTION = 0.2;

    private readonly mesh: Mesh;
    private readonly material: StarMaterial;

    internalTime = 0;

    override readonly bodyType = BodyType.STAR;
    override readonly physicalProperties: StarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    override readonly radius;

    constructor(name: string, starSystemManager: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng) * Settings.EARTH_RADIUS;

        starSystemManager.addStar(this)

        this.physicalProperties = {
            //TODO: do not hardcode
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,

            temperature: clamp(normalRandom(5778, 2000, this.rng), 4000, 10000)
        };

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: this.radius * 2, segments: 32 }, starSystemManager.scene);
        starSystemManager.scene.registerMeshDepth(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new StarMaterial(this, starSystemManager.scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            volumetricLight: new VolumetricLight(this, this.mesh, this.starSystem.scene),
            rings: null
        };

        if (uniformRandBool(Star.RING_PROPORTION, this.rng)) {
            const rings = this.createRings();
            rings.settings.ringStart = normalRandom(3, 1, this.rng);
            rings.settings.ringEnd = normalRandom(7, 1, this.rng);
            rings.settings.ringOpacity = this.rng();
        }
    }

    public override update(player: PlayerController, deltaTime: number): void {
        super.update(player, deltaTime);

        this.material.update();

        this.internalTime += deltaTime;
        this.internalTime %= 24 * 60 * 60; // prevent imprecision in shader material (noise offset)
    }
}
