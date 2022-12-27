import { Mesh, MeshBuilder } from "@babylonjs/core";

import { BodyType } from "../interfaces";
import { AbstractController } from "../../uberCore/abstractController";
import { PlanetPhysicalProperties } from "../physicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planet } from "./planet";
import { Star } from "../stars/star";
import { BlackHole } from "../blackHole";
import { GasPlanetDescriptor } from "../../descriptors/gasPlanetDescriptor";

export class GasPlanet extends AbstractBody implements Planet {
    override readonly bodyType = BodyType.GAZ;
    override readonly physicalProperties: PlanetPhysicalProperties;
    override readonly radius;

    override readonly postProcesses: PlanetPostProcesses;

    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    readonly descriptor: GasPlanetDescriptor;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, seed, parentBodies);

        this.descriptor = new GasPlanetDescriptor(seed);

        this.radius = this.descriptor.radius;

        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            minTemperature: -180,
            maxTemperature: 200,
            pressure: 1
        };

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.descriptor.radius * 2,
                segments: 64
            },
            scene
        );
        this.mesh.parent = this.transform.node;

        this.material = new GasPlanetMaterial(this.name, this.transform, this.descriptor.radius, this.seed, this.rng, scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            overlay: true,
            atmosphere: true,
            rings: this.descriptor.hasRings
        };
    }

    updateTransform(player: AbstractController, deltaTime: number) {
        super.updateTransform(player, deltaTime);
    }

    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[]): void {
        this.material.update(controller, stars);
    }
}
