import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";
import { TerrainSettings } from "../../terrain/terrainSettings";
import { AbstractPlanet } from "./abstractPlanet";

import { Axis, MeshBuilder, Scene, Space, Vector3 } from "@babylonjs/core";

import { BodyType, RigidBody } from "../interfaces";
import { CollisionData } from "../../chunks/workerDataInterfaces";
import { TaskType } from "../../chunks/taskInterfaces";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { Settings } from "../../settings";
import { ISolidPhysicalProperties } from "../iPhysicalProperties";
import { SolidPlanetMaterial } from "../../materials/solidPlanetMaterial";
import { IOrbitalBody } from "../../orbits/iOrbitalBody";
import { uniformRandBool } from "extended-random";
import { RingMaterial } from "../../materials/ringMaterial";

export class SolidPlanet extends AbstractPlanet implements RigidBody {
    oceanLevel: number;

    override readonly physicalProperties: ISolidPhysicalProperties;

    protected bodyType = BodyType.SOLID;

    public terrainSettings: TerrainSettings;

    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    material: SolidPlanetMaterial;

    constructor(id: string, radius: number, starSystemManager: StarSystemManager, scene: Scene, seed: number, parentBodies: IOrbitalBody[]) {
        super(id, radius, starSystemManager, seed, parentBodies);

        this.physicalProperties = {
            mass: 10,
            rotationPeriod: 60 * 60 * 24,
            minTemperature: -60,
            maxTemperature: 40,
            pressure: 1,
            waterAmount: 1
        };

        // TODO: faire quelque chose de réaliste
        this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        this.terrainSettings = {
            continentsFragmentation: 0.47,

            bumpsFrequency: 30,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 20e3,
            continentBaseHeight: 5e3,

            mountainsFrequency: 10,
            mountainsMinValue: 0.5
        };

        this.material = new SolidPlanetMaterial(this, scene);

        this.sides = [
            new ChunkTree(Direction.Up, this),
            new ChunkTree(Direction.Down, this),
            new ChunkTree(Direction.Forward, this),
            new ChunkTree(Direction.Backward, this),
            new ChunkTree(Direction.Right, this),
            new ChunkTree(Direction.Left, this)
        ];

        /// POSTPROCESSES ORDER : OCEAN, CLOUD, ATMO, RINGS
        if (uniformRandBool(0.6, this.rng)) {
            this.createRings(starSystemManager.stars[0], scene);
            /*let ringMesh = MeshBuilder.CreatePlane(`${this._name}Rings`, {
                size: this.postProcesses.rings!.settings.ringEnd * this.getApparentRadius() * 2
            }, scene);
            ringMesh.rotate(Axis.X, Math.PI/2, Space.WORLD);
            ringMesh.material = new RingMaterial(this, scene);
            starSystemManager.depthRenderer.getDepthMap().renderList!.push(ringMesh);
            ringMesh.parent = this.transform;
            this.postProcesses.rings!.dispose();*/
        }

        if (this.physicalProperties.waterAmount > 0 && this.physicalProperties.pressure > 0.3 && uniformRandBool(0.95, this.rng)) {
            let flatClouds = this.createClouds(Settings.CLOUD_LAYER_HEIGHT, starSystemManager.stars[0], scene);
            flatClouds.settings.cloudPower = 10 * Math.exp(-this.physicalProperties.waterAmount * this.physicalProperties.pressure);
        }
    }

    public generateCollisionTask(relativePosition: Vector3): CollisionData {
        let collisionData: CollisionData = {
            seed: this.getSeed(),
            taskType: TaskType.Collision,
            planetName: this._name,
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
