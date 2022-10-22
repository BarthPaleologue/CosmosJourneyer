import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";
import { TerrainSettings } from "../../terrain/terrainSettings";

import { Vector3 } from "@babylonjs/core";

import { BodyType, RigidBody } from "../interfaces";
import { CollisionData } from "../../chunks/workerDataTypes";
import { TaskType } from "../../chunks/taskTypes";
import { AbstractController } from "../../controllers/abstractController";
import { StarSystem } from "../starSystem";
import { Settings } from "../../settings";
import { SolidPhysicalProperties } from "../physicalProperties";
import { TelluricMaterial } from "../../materials/telluricMaterial";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { normalRandom, uniformRandBool } from "extended-random";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { clamp } from "../../utils/gradientMath";
import { TelluricPlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";

enum Steps {
    RADIUS = 1000,
    PRESSURE = 1100,
    WATER_AMOUNT = 1200,
    ATMOSPHERE = 1300,
    RINGS = 1400,
    TERRAIN = 1500
}

export class TelluricPlanet extends AbstractBody implements RigidBody {
    oceanLevel: number;

    override readonly physicalProperties: SolidPhysicalProperties;
    override readonly bodyType = BodyType.TELLURIC;
    override readonly radius: number;
    readonly ratio: number;

    override readonly postProcesses: TelluricPlanetPostProcesses;

    readonly terrainSettings: TerrainSettings;

    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    readonly material: TelluricMaterial;

    isSatelliteOfTelluric = false;
    isSatelliteOfGas = false;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param starSystem The star system the planet is in
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, starSystem: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(name, starSystem, seed, parentBodies);

        for (const parentBody of parentBodies) {
            if (parentBody.bodyType == BodyType.TELLURIC) this.isSatelliteOfTelluric = true;
            if (parentBody.bodyType == BodyType.GAZ) this.isSatelliteOfGas = true;
        }

        if (this.isSatelliteOfTelluric) {
            this.radius = Math.max(0.02, normalRandom(0.08, 0.03, this.rng, Steps.RADIUS)) * Settings.EARTH_RADIUS;
        } else if (this.isSatelliteOfGas) {
            this.radius = Math.max(0.02, normalRandom(0.5, 0.1, this.rng, Steps.RADIUS)) * Settings.EARTH_RADIUS;
        } else {
            this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.rng, Steps.RADIUS)) * Settings.EARTH_RADIUS;
        }

        let pressure;
        if (this.isSatelliteOfTelluric) {
            pressure = Math.max(normalRandom(0.01, 0.01, this.rng, Steps.PRESSURE), 0);
        } else {
            pressure = Math.max(normalRandom(0.9, 0.2, this.rng, Steps.PRESSURE), 0);
        }

        const waterAmount = Math.max(normalRandom(1.0, 0.3, this.rng, Steps.WATER_AMOUNT), 0);

        if (this.radius <= 0.3 * Settings.EARTH_RADIUS) pressure = 0;

        this.ratio = this.radius / Settings.EARTH_RADIUS;

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 60 * 60 * 24,
            minTemperature: -60,
            maxTemperature: 40,
            pressure: pressure,
            waterAmount: waterAmount
        };

        this.postProcesses = {
            overlay: true,
            atmosphere: false,
            ocean: false,
            clouds: false,
            rings: false
        };

        const waterBoilingPoint = waterBoilingPointCelsius(this.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (pressure > epsilon) {
            if (waterFreezingPoint > this.physicalProperties.minTemperature && waterFreezingPoint < this.physicalProperties.maxTemperature) {
                this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;
                this.postProcesses.ocean = true;
                this.postProcesses.clouds = true;//new FlatCloudsPostProcess(`${this.name}Clouds`, this, Settings.CLOUD_LAYER_HEIGHT, starSystem.scene, this.starSystem);
            } else {
                this.oceanLevel = 0;
            }
            this.postProcesses.atmosphere = true;
        } else {
            this.oceanLevel = 0;
        }

        if (uniformRandBool(0.6, this.rng, Steps.RINGS) && !this.isSatelliteOfTelluric && !this.isSatelliteOfGas) {
            this.postProcesses.rings = true;
        }

        const continentsFragmentation = clamp(normalRandom(0.45, 0.03, this.rng, Steps.TERRAIN), 0, 0.95);

        this.terrainSettings = {
            continentsFrequency: this.ratio,
            continentsFragmentation: continentsFragmentation,

            bumpsFrequency: 30 * this.ratio,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 13e3,
            continentBaseHeight: this.oceanLevel * 2.5,

            mountainsFrequency: 20 * this.ratio
        };

        if (this.isSatelliteOfTelluric) this.terrainSettings.continentsFragmentation /= 2;

        this.material = new TelluricMaterial(this, starSystem.scene);

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene),
            new ChunkTree(Direction.Down, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene),
            new ChunkTree(Direction.Forward, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene),
            new ChunkTree(Direction.Backward, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene),
            new ChunkTree(Direction.Right, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene),
            new ChunkTree(Direction.Left, this.name, this.seed, this.getRadius(), this.terrainSettings, this, this.material, this.starSystem.scene)
        ];
    }

    public generateCollisionTask(relativePosition: Vector3): CollisionData {
        const collisionData: CollisionData = {
            seed: this.seed,
            taskType: TaskType.Collision,
            planetName: this.name,
            terrainSettings: this.terrainSettings,
            position: [relativePosition.x, relativePosition.y, relativePosition.z],
            planetDiameter: this.getDiameter()
        };
        return collisionData;
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     */
    private updateLOD(observerPosition: Vector3): void {
        for (const side of this.sides) side.update(observerPosition);
    }

    /**
     * Regenerates the chunks
     */
    public reset(): void {
        for (const side of this.sides) side.reset();
    }

    public override updateTransform(player: AbstractController, deltaTime: number): void {
        super.updateTransform(player, deltaTime);
        this.updateLOD(player.transform.getAbsolutePosition());
        this.material.update();
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.oceanLevel;
    }
}
