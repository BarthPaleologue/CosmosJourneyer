import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";
import { TerrainSettings } from "../../terrain/terrainSettings";
import { AbstractPlanet } from "./abstractPlanet";

import { Vector3 } from "@babylonjs/core";

import { BodyType, RigidBody } from "../interfaces";
import { CollisionData } from "../../chunks/workerDataInterfaces";
import { TaskType } from "../../chunks/taskInterfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { Settings } from "../../settings";
import { ISolidPhysicalProperties } from "../iPhysicalProperties";
import { TelluricPlanetMaterial } from "../../materials/telluricPlanetMaterial";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { normalRandom, uniformRandBool } from "extended-random";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { FlatCloudsPostProcess } from "../../postProcesses/planetPostProcesses/flatCloudsPostProcess";
import { OceanPostProcess } from "../../postProcesses/planetPostProcesses/oceanPostProcess";
import { clamp } from "../../utils/math";

export class TelluricPlanet extends AbstractPlanet implements RigidBody {
    oceanLevel: number;

    override readonly physicalProperties: ISolidPhysicalProperties;
    override readonly bodyType = BodyType.TELLURIC;
    override readonly radius: number;

    readonly terrainSettings: TerrainSettings;

    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    readonly material: TelluricPlanetMaterial;

    private isSatelliteOfTelluric = false;

    constructor(id: string, radius: number, starSystemManager: StarSystemManager, seed: number, parentBodies: IOrbitalBody[]) {
        super(id, starSystemManager, seed, parentBodies);

        for(const parentBody of parentBodies) {
            if(parentBody.bodyType == BodyType.TELLURIC) this.isSatelliteOfTelluric = true
        }

        const pressure = Math.max(normalRandom(0.8, 0.4, this.rng), 0);
        const waterAmount = Math.max(normalRandom(1.2, 0.3, this.rng), 0);

        this.radius = radius;

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 60 * 60 * 24,
            minTemperature: -60,
            maxTemperature: 40,
            pressure: pressure,
            waterAmount: waterAmount
        };

        const waterBoilingPoint = waterBoilingPointCelsius(this.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        if(waterFreezingPoint > this.physicalProperties.minTemperature && waterFreezingPoint < this.physicalProperties.maxTemperature) {
            this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;
            const ocean = new OceanPostProcess(`${this.name}Ocean`, this, starSystemManager.stars[0], starSystemManager.scene);
            this.postProcesses.ocean = ocean;

            const clouds = new FlatCloudsPostProcess(`${this.name}Clouds`, this, Settings.CLOUD_LAYER_HEIGHT, starSystemManager.stars[0], starSystemManager.scene);
            clouds.settings.cloudPower = 5 * Math.exp(-this.physicalProperties.waterAmount * this.physicalProperties.pressure);
            this.postProcesses.clouds = clouds;
        } else {
            this.oceanLevel = 0;
        }

        if(pressure > 0) {
            this.createAtmosphere(Settings.ATMOSPHERE_HEIGHT, starSystemManager.stars[0], starSystemManager.scene);
        }

        if (uniformRandBool(0.6, this.rng)) {
            this.createRings(starSystemManager.stars[0], starSystemManager.scene);
            /*let ringMesh = MeshBuilder.CreatePlane(`${this._name}Rings`, {
                size: this.postProcesses.rings!.settings.ringEnd * this.getApparentRadius() * 2
            }, scene);
            ringMesh.rotate(Axis.X, Math.PI/2, Space.WORLD);
            ringMesh.material = new RingMaterial(this, scene);
            starSystemManager.depthRenderer.getDepthMap().renderList!.push(ringMesh);
            ringMesh.parent = this.transform;
            this.postProcesses.rings!.dispose();*/
        }

        const continentsFragmentation = clamp(normalRandom(0.5, 0.2, this.rng), 0, 1);

        this.terrainSettings = {
            continentsFragmentation: continentsFragmentation,

            bumpsFrequency: 30,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 30e3,
            continentBaseHeight: 5e3,

            mountainsFrequency: 10,
            mountainsMinValue: 0.5
        };

        this.material = new TelluricPlanetMaterial(this, starSystemManager.scene);

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
        let collisionData: CollisionData = {
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

    public override update(player: PlayerController, starPosition: Vector3, deltaTime: number): void {
        super.update(player, starPosition, deltaTime);
        this.material.update(player, starPosition);
        this.updateLOD(player.getAbsolutePosition());
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.oceanLevel;
    }
}
