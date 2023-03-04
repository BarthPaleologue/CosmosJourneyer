import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";

import { Axis, Vector3 } from "@babylonjs/core";

import { BodyType, RigidBody } from "../interfaces";
import { TransferCollisionData } from "../../chunks/workerDataTypes";
import { TaskType } from "../../chunks/taskTypes";
import { AbstractController } from "../../uberCore/abstractController";
import { TelluricMaterial } from "../../materials/telluricMaterial";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { TelluricPlanetPostProcesses } from "../postProcessesInterfaces";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planemo } from "./planemo";
import { Star } from "../stars/star";
import { BlackHole } from "../stars/blackHole";
import { TelluricPlanetDescriptor } from "../../descriptors/telluricPlanetDescriptor";

export class TelluricPlanet extends AbstractBody implements RigidBody, Planemo {
    override readonly bodyType = BodyType.TELLURIC;

    override readonly postProcesses: TelluricPlanetPostProcesses;

    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    readonly material: TelluricMaterial;

    readonly descriptor: TelluricPlanetDescriptor;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param scene
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies);

        this.descriptor = new TelluricPlanetDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);

        this.postProcesses = {
            overlay: true,
            atmosphere: false,
            ocean: false,
            clouds: false,
            rings: false
        };

        const waterBoilingPoint = waterBoilingPointCelsius(this.descriptor.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (this.descriptor.physicalProperties.pressure > epsilon) {
            if (waterFreezingPoint > this.descriptor.physicalProperties.minTemperature && waterFreezingPoint < this.descriptor.physicalProperties.maxTemperature) {
                this.postProcesses.ocean = true;
                this.postProcesses.clouds = true;
            } else {
                this.descriptor.physicalProperties.oceanLevel = 0;
            }
            this.postProcesses.atmosphere = true;
        } else {
            this.descriptor.physicalProperties.oceanLevel = 0;
        }

        this.postProcesses.rings = this.descriptor.hasRings;

        this.material = new TelluricMaterial(this.name, this.transform, this.descriptor, scene);

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Down, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Forward, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Backward, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Right, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Left, this.name, this.descriptor, this.transform, this.material, scene)
        ];
    }

    public generateCollisionTask(relativePosition: Vector3): TransferCollisionData {
        const collisionData: TransferCollisionData = {
            seed: this.descriptor.seed,
            taskType: TaskType.Collision,
            planetName: this.name,
            terrainSettings: this.descriptor.terrainSettings,
            position: [relativePosition.x, relativePosition.y, relativePosition.z],
            planetDiameter: this.getDiameter()
        };
        return collisionData;
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     */
    public updateLOD(observerPosition: Vector3): void {
        for (const side of this.sides) side.update(observerPosition);
    }

    /**
     * Regenerates the chunks
     */
    public reset(): void {
        for (const side of this.sides) side.reset();
    }

    public updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[]): void {
        this.material.update(controller, stars);
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.descriptor.physicalProperties.oceanLevel;
    }
}
