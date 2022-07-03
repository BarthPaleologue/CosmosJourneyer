import { DepthRenderer, Mesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";

import { AbstractPlanet } from "./abstractPlanet";
import { BodyType } from "../interfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { IPlanetPhysicalProperties } from "../iPhysicalProperties";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { GazPlanetMaterial } from "../../materials/gazPlanetMaterial";
import { centeredRand, uniformRandBool } from "extended-random";
import { Settings } from "../../settings";

export class GazPlanet extends AbstractPlanet {
    protected override bodyType = BodyType.GAZ;
    override readonly physicalProperties: IPlanetPhysicalProperties;
    override readonly radius;

    private readonly mesh: Mesh;
    readonly material: GazPlanetMaterial;

    constructor(name: string, radius: number, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystemManager, seed, parentBodies);

        this.radius = radius;

        this.physicalProperties = {
            // FIXME: choose physically accurates values
            mass: 10,
            rotationPeriod: 24 * 60 * 60,
            minTemperature: 100,
            maxTemperature: 110,
            pressure: 1
        };

        this.mesh = MeshBuilder.CreateSphere(`${name}Mesh`, { diameter: radius * 2, segments: 64 }, starSystemManager.scene);
        starSystemManager.depthRenderer.getDepthMap().renderList!.push(this.mesh);
        this.mesh.parent = this.transform;

        this.material = new GazPlanetMaterial(this, starSystemManager.scene);
        this.mesh.material = this.material;

        // FIXME: implement multiple stars
        let atmosphere = this.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, starSystemManager.stars[0], starSystemManager.scene);
        atmosphere.settings.redWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.rng) / 6;
        atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.rng) / 6;

        if (uniformRandBool(0.8, this.rng)) {
            this.createRings(starSystemManager.stars[0], starSystemManager.scene);
        }

    }

    public override update(player: PlayerController, lightPosition: Vector3, deltaTime: number): void {
        super.update(player, lightPosition, deltaTime);
        this.material.update(player, lightPosition);
    }
}
