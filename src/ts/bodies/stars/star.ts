import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, Quaternion } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { AbstractController } from "../../controllers/abstractController";
import { StarSystem } from "../starSystem";
import { StarPhysicalProperties } from "../physicalProperties";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/gradientMath";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { Settings } from "../../settings";

enum Steps {
    RADIUS = 1000,
    TEMPERATURE = 1100,
    RINGS = 1200
}

export class Star extends AbstractBody {
    static RING_PROPORTION = 0.2;

    readonly mesh: Mesh;
    private readonly material: StarMaterial;

    internalTime = 0;

    override readonly bodyType = BodyType.STAR;
    override readonly physicalProperties: StarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    override readonly radius;

    /**
     * New Star
     * @param name The name of the star
     * @param starSystemManager The star system the star is in
     * @param seed The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, starSystemManager: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);

        //TODO: make it dependent on star type
        this.radius = randRange(50, 200, this.rng, Steps.RADIUS) * Settings.EARTH_RADIUS;

        this.physicalProperties = {
            //TODO: do not hardcode
            mass: 1000,
            rotationPeriod: 24 * 60 * 60,

            temperature: clamp(normalRandom(5778, 2000, this.rng, Steps.TEMPERATURE), 4000, 10000)
        };

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.radius * 2,
                segments: 32
            },
            starSystemManager.scene
        );
        this.mesh.parent = this.node;

        this.material = new StarMaterial(this, starSystemManager.scene);
        this.mesh.material = this.material;

        // TODO: remove when rotation is transmitted to children
        this.node.rotationQuaternion = Quaternion.Identity();

        this.postProcesses = {
            overlay: true,
            volumetricLight: true,
            rings: false
        };

        if (uniformRandBool(Star.RING_PROPORTION, this.rng, Steps.RINGS)) this.postProcesses.rings = true;
    }

    public override updateTransform(player: AbstractController, deltaTime: number): void {
        super.updateTransform(player, deltaTime);

        this.material.update();

        this.internalTime += deltaTime;
        this.internalTime %= 24 * 60 * 60; // prevent imprecision in shader material (noise offset)
    }
}
