import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";
import { TerrainSettings } from "../../terrain/terrainSettings";

import { Vector3 } from "@babylonjs/core";

import { BodyType, RigidBody } from "../interfaces";
import { CollisionData } from "../../chunks/workerDataTypes";
import { TaskType } from "../../chunks/taskTypes";
import { PlayerController } from "../../player/playerController";
import { StarSystem } from "../starSystem";
import { Settings } from "../../settings";
import { SolidPhysicalProperties } from "../physicalProperties";
import { TelluricMaterial } from "../../materials/telluricMaterial";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { centeredRand, normalRandom, uniformRandBool } from "extended-random";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { FlatCloudsPostProcess } from "../../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { OceanPostProcess } from "../../postProcesses/planetPostProcesses/oceanPostProcess";
import { clamp } from "../../utils/gradientMath";
import { AtmosphericScatteringPostProcess } from "../../postProcesses/planetPostProcesses/atmosphericScatteringPostProcess";
import { TelluricPlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";

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

    constructor(id: string, starSystem: StarSystem, seed: number, parentBodies: IOrbitalBody[]) {
        super(id, starSystem, seed, parentBodies);

        starSystem.planets.push(this);

        for (const parentBody of parentBodies) {
            if (parentBody.bodyType == BodyType.TELLURIC) this.isSatelliteOfTelluric = true;
            if (parentBody.bodyType == BodyType.GAZ) this.isSatelliteOfGas = true;
        }

        let pressure;
        if (this.isSatelliteOfTelluric) {
            pressure = Math.max(normalRandom(0.01, 0.01, this.getRNG(), 30), 0);
        } else {
            pressure = Math.max(normalRandom(0.9, 0.2, this.getRNG(), 30), 0);
        }

        const waterAmount = Math.max(normalRandom(1.0, 0.3, this.getRNG(), 31), 0);

        if (this.isSatelliteOfTelluric || this.isSatelliteOfGas) {
            this.radius = Math.max(0.02, normalRandom(0.08, 0.03, this.getRNG(), 32)) * Settings.EARTH_RADIUS;
        } else {
            this.radius = Math.max(0.3, normalRandom(1.0, 0.1, this.getRNG(), 32)) * Settings.EARTH_RADIUS;
        }

        if(this.radius <= 0.3 * Settings.EARTH_RADIUS) pressure = 0;

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
            atmosphere: null,
            ocean: null,
            clouds: null,
            rings: null
        };

        const waterBoilingPoint = waterBoilingPointCelsius(this.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (pressure > epsilon) {
            if (waterFreezingPoint > this.physicalProperties.minTemperature && waterFreezingPoint < this.physicalProperties.maxTemperature) {
                this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;
                const ocean = new OceanPostProcess(`${this.name}Ocean`, this, starSystem.scene);
                this.postProcesses.ocean = ocean;

                const clouds = new FlatCloudsPostProcess(`${this.name}Clouds`, this, Settings.CLOUD_LAYER_HEIGHT, starSystem.scene);
                clouds.settings.cloudCoverage = Math.exp(-this.physicalProperties.waterAmount * this.physicalProperties.pressure);
                this.postProcesses.clouds = clouds;
            } else {
                this.oceanLevel = 0;
            }
            const atmosphere = new AtmosphericScatteringPostProcess(`${this.name}Atmosphere`, this, Settings.ATMOSPHERE_HEIGHT, this.starSystem.scene);
            atmosphere.settings.intensity = 12 * this.physicalProperties.pressure;
            atmosphere.settings.redWaveLength *= 1 + centeredRand(this.getRNG(), 40) / 6;
            atmosphere.settings.greenWaveLength *= 1 + centeredRand(this.getRNG(), 41) / 6;
            atmosphere.settings.blueWaveLength *= 1 + centeredRand(this.getRNG(), 42) / 6;
            this.postProcesses.atmosphere = atmosphere;
        } else {
            this.oceanLevel = 0;
        }

        if (uniformRandBool(0.6, this.getRNG(), 50) && !this.isSatelliteOfTelluric) {
            this.createRings();
        }

        const continentsFragmentation = clamp(normalRandom(0.45, 0.03, this.getRNG(), 60), 0, 0.95);

        this.terrainSettings = {
            continentsFrequency: this.ratio,
            continentsFragmentation: continentsFragmentation,

            bumpsFrequency: 30,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 13e3,
            continentBaseHeight: this.oceanLevel * 2,

            mountainsFrequency: 20 * this.ratio,
        };

        if(this.isSatelliteOfTelluric) this.terrainSettings.continentsFragmentation = 0;

        this.material = new TelluricMaterial(this, starSystem.scene);

        this.sides = [
            new ChunkTree(Direction.Up, this),
            new ChunkTree(Direction.Down, this),
            new ChunkTree(Direction.Forward, this),
            new ChunkTree(Direction.Backward, this),
            new ChunkTree(Direction.Right, this),
            new ChunkTree(Direction.Left, this)
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

    public override update(player: PlayerController, deltaTime: number): void {
        super.update(player, deltaTime);
        this.material.update(player);
        this.updateLOD(player.getAbsolutePosition());
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.oceanLevel;
    }
}
