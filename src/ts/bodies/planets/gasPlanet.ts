import { Mesh, MeshBuilder } from "@babylonjs/core";

import { BodyType } from "../interfaces";
import { AbstractController } from "../../uberCore/abstractController";
import { PlanetPhysicalProperties } from "../physicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planet } from "./planet";
import { Star } from "../stars/star";
import { BlackHole } from "../blackHole";

enum Steps {
    RADIUS = 1000,
    ATMOSPHERE = 1100,
    RINGS = 1200
}

export class GasPlanet extends AbstractBody implements Planet {
    override readonly bodyType = BodyType.GAZ;
    override readonly physicalProperties: PlanetPhysicalProperties;
    override readonly radius;

    override readonly postProcesses: PlanetPostProcesses;

    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param starSystem The star system the planet is in
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, seed, parentBodies);

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng, Steps.RADIUS);

        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            minTemperature: 100,
            maxTemperature: 110,
            pressure: 1
        };

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.radius * 2,
                segments: 64
            },
            scene
        );
        this.mesh.parent = this.transform.node;

        this.material = new GasPlanetMaterial(this.name, this.transform, this.getRadius(), this.seed, this.rng, scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            overlay: true,
            atmosphere: true,
            rings: false
        };

        if (uniformRandBool(0.8, this.rng, Steps.RINGS)) this.postProcesses.rings = true;
    }

    updateTransform(player: AbstractController, deltaTime: number) {
        super.updateTransform(player, deltaTime);
    }

    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[]): void {
        this.material.update(controller, stars);
    }
}
