import { Mesh, MeshBuilder } from "@babylonjs/core";

import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystem } from "../starSystem";
import { PlanetPhysicalProperties } from "../physicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { PlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";

export class GasPlanet extends AbstractBody {
    override readonly bodyType = BodyType.GAZ;
    override readonly physicalProperties: PlanetPhysicalProperties;
    override readonly radius;

    override readonly postProcesses: PlanetPostProcesses;

    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    constructor(name: string, starSystem: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystem, seed, parentBodies);

        starSystem.planets.push(this);

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.getRNG(), 33);

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
        starSystem.scene.registerMeshDepth(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new GasPlanetMaterial(this, starSystem.scene);
        this.mesh.material = this.material;

        this.postProcesses = {
            atmosphere: null,
            rings: null
        };

        // FIXME: implement multiple stars
        const atmosphere = new AtmosphericScatteringPostProcess(`${this.name}Atmosphere`, this, Settings.ATMOSPHERE_HEIGHT, this.starSystem.scene);
        atmosphere.settings.intensity = 12 * this.physicalProperties.pressure;
        atmosphere.settings.redWaveLength *= 1 + centeredRand(this.getRNG(), 70) / 6;
        atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.getRNG(), 71) / 6;
        atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.getRNG(), 72) / 6;

        this.postProcesses.atmosphere = atmosphere;

        if (uniformRandBool(0.8, this.getRNG(), 73)) this.createRings();
    }

    public override update(player: PlayerController, deltaTime: number): void {
        super.update(player, deltaTime);
        this.material.update(player);
    }
}
