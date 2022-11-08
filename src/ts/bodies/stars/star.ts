import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, PointLight, Quaternion, Vector3 } from "@babylonjs/core";
import { BodyType } from "../interfaces";
import { AbstractController } from "../../uberCore/abstractController";
import { StarPhysicalProperties } from "../physicalProperties";
import { StarPostProcesses } from "../postProcessesInterfaces";
import { StarMaterial } from "../../materials/starMaterial";
import { normalRandom, randRange, uniformRandBool } from "extended-random";
import { clamp } from "../../utils/gradientMath";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { Settings } from "../../settings";
import { UberScene } from "../../uberCore/uberScene";
import { getRgbFromTemperature } from "../../utils/specrend";

enum Steps {
    RADIUS = 1000,
    TEMPERATURE = 1100,
    RINGS = 1200
}

export class Star extends AbstractBody {
    static RING_PROPORTION = 0.2;

    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    override readonly bodyType = BodyType.STAR;
    override readonly physicalProperties: StarPhysicalProperties;

    public override postProcesses: StarPostProcesses;

    override readonly radius;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param seed The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, seed, parentBodies);

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
            scene
        );
        this.mesh.parent = this.transform.node;

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.physicalProperties.temperature).asArray());
        this.light.parent = this.transform.node;

        this.material = new StarMaterial(this.transform, this.seed, this.physicalProperties, scene);
        this.mesh.material = this.material;

        // TODO: remove when rotation is transmitted to children
        this.transform.node.rotationQuaternion = Quaternion.Identity();

        this.postProcesses = {
            overlay: true,
            volumetricLight: true,
            rings: false
        };

        if (uniformRandBool(Star.RING_PROPORTION, this.rng, Steps.RINGS)) this.postProcesses.rings = true;
    }

    public override updateTransform(player: AbstractController, deltaTime: number): void {
        super.updateTransform(player, deltaTime);
        this.material.update(this.getInternalTime());
    }
}
