import { Mesh, MeshBuilder, Vector3 } from "@babylonjs/core";

import { AbstractPlanet } from "./abstractPlanet";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { PlanetPhysicalProperties } from "../physicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GazPlanetMaterial } from "../../materials/gazPlanetMaterial";
import { centeredRand, randRangeInt, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";

export class GazPlanet extends AbstractPlanet {
    override readonly bodyType = BodyType.GAZ;
    override readonly physicalProperties: PlanetPhysicalProperties;
    override readonly radius;

    private readonly mesh: Mesh;
    readonly material: GazPlanetMaterial;

    constructor(name: string, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);

        this.radius = randRangeInt(Settings.EARTH_RADIUS * 4, Settings.EARTH_RADIUS * 20, this.rng);

        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            minTemperature: 100,
            maxTemperature: 110,
            pressure: 1
        };

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: this.radius * 2, segments: 64 }, starSystemManager.scene);
        starSystemManager.registerMeshDepth(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new GazPlanetMaterial(this, starSystemManager.scene);
        this.mesh.material = this.material;

        // FIXME: implement multiple stars
        const atmosphere = this.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, starSystemManager.stars[0], starSystemManager.scene);
        atmosphere.settings.redWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.rng) / 6;

        if (uniformRandBool(0.8, this.rng)) {
            this.createRings();
        }
    }

    public override update(player: PlayerController, deltaTime: number): void {
        super.update(player, deltaTime);
        this.material.update(player);
    }
}
