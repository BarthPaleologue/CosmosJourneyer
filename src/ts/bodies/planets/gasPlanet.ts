import { Mesh, MeshBuilder } from "@babylonjs/core";

import { BodyType } from "../interfaces";
import { AbstractController } from "../../controllers/abstractController";
import { StarSystem } from "../starSystem";
import { PlanetPhysicalProperties } from "../physicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";

enum Steps {
    RADIUS = 1000,
    ATMOSPHERE = 1100,
    RINGS = 1200,
}

export class GasPlanet extends AbstractBody {
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
    constructor(name: string, starSystem: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystem, seed, parentBodies);

        starSystem.planets.push(this);

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
            starSystem.scene
        );
        this.mesh.parent = this.node;

        this.material = new GasPlanetMaterial(this, starSystem.scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            atmosphere: null,
            rings: null
        };

        // FIXME: implement multiple stars
        const atmosphere = new AtmosphericScatteringPostProcess(`${this.name}Atmosphere`, this, Settings.ATMOSPHERE_HEIGHT, this.starSystem.scene);
        atmosphere.settings.intensity = 12 * this.physicalProperties.pressure;
        atmosphere.settings.redWaveLength *= 1 + centeredRand(this.rng, Steps.ATMOSPHERE) / 6;
        atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.rng, Steps.ATMOSPHERE + 10) / 6;
        atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.rng, Steps.ATMOSPHERE + 20) / 6;

        this.postProcesses.atmosphere = atmosphere;

        if (uniformRandBool(0.8, this.rng, Steps.RINGS)) this.createRings();
    }

    public override updateTransform(player: AbstractController, deltaTime: number): void {
        super.updateTransform(player, deltaTime);
    }

    public override updateGraphics(controller: AbstractController, deltaTime: number): void {
        super.updateGraphics(controller, deltaTime);
        this.material.update(controller);
    }
}
