import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";
import { TerrainSettings } from "../../terrain/terrainSettings";
import { AbstractPlanet } from "./abstractPlanet";

import { Axis, Matrix, Mesh, Quaternion, Scene, Space, Vector3 } from "@babylonjs/core";

import { CelestialBodyType, RigidBody } from "../interfaces";
import { CollisionData } from "../../chunks/workerDataInterfaces";
import { TaskType } from "../../chunks/taskInterfaces";
import { initMeshTransform } from "../../utils/mesh";
import { PlayerController } from "../../player/playerController";
import { StarSystemManager } from "../starSystemManager";
import { Settings } from "../../settings";
import { Algebra } from "../../utils/algebra";
import { SolidPhysicalProperties } from "../physicalPropertiesInterfaces";
import { SolidPlanetMaterial } from "../../materials/solidPlanetMaterial";

export class SolidPlanet extends AbstractPlanet implements RigidBody {
    readonly oceanLevel: number;

    override readonly physicalProperties: SolidPhysicalProperties;

    protected bodyType = CelestialBodyType.SOLID;

    public terrainSettings: TerrainSettings;

    readonly attachNode: Mesh; // reprensents the center of the sphere
    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    material: SolidPlanetMaterial;

    constructor(
        id: string,
        radius: number,
        starSystemManager: StarSystemManager,
        scene: Scene,
        physicalProperties: SolidPhysicalProperties = {
            mass: 10,
            rotationPeriod: 60 * 60 * 24,
            rotationAxis: Axis.Y,
            minTemperature: -60,
            maxTemperature: 40,
            pressure: 1,
            waterAmount: 1
        },
        seed = [0, 0, 0]
    ) {
        super(id, radius, starSystemManager, seed);

        this.physicalProperties = physicalProperties;

        // TODO: faire quelque chose de réaliste
        this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        this.attachNode = new Mesh(`${this._name}AttachNode`, scene);

        initMeshTransform(this.attachNode);

        this.terrainSettings = {
            continentsFragmentation: 0.47,

            bumpsFrequency: 3e-5,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 20e3,
            continentBaseHeight: 5e3,

            mountainsFrequency: 10e-6,
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

    public override getWorldMatrix(): Matrix {
        return this.attachNode.getWorldMatrix();
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

    public getAbsolutePosition() {
        if (this.attachNode.getAbsolutePosition()._isDirty) this.attachNode.computeWorldMatrix(true);
        return this.attachNode.getAbsolutePosition();
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.oceanLevel;
    }

    public setAbsolutePosition(newPosition: Vector3): void {
        this.attachNode.setAbsolutePosition(newPosition);
    }

    public getRotationQuaternion(): Quaternion {
        if (this.attachNode.rotationQuaternion == undefined) throw new Error(`Undefined quaternion for ${this.getName()}`);
        if (this.attachNode.rotationQuaternion._isDirty) this.attachNode.computeWorldMatrix(true);
        return this.attachNode.rotationQuaternion;
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.attachNode.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number) {
        this.attachNode.rotate(axis, amount, Space.WORLD);
        super.rotate(axis, amount);
    }
}
