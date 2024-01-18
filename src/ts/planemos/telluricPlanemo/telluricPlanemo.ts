import { Direction } from "../../utils/direction";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";

import { TelluricPlanemoMaterial } from "./telluricPlanemoMaterial";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { UberScene } from "../../uberCore/uberScene";
import { TelluricPlanemoModel } from "./telluricPlanemoModel";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ChunkTree } from "./terrain/chunks/chunkTree";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Transformable } from "../../uberCore/transforms/basicTransform";
import { ChunkForge } from "./terrain/chunks/chunkForge";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PlanetChunk } from "./terrain/chunks/planetChunk";
import { Planemo } from "../../architecture/planemo";
import { Cullable } from "../../bodies/cullable";
import { HasBodyModel, PhysicalProperties } from "../../model/common";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { OrbitalObject } from "../../architecture/orbitalObject";
import { CelestialBody } from "../../architecture/celestialBody";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";

export class TelluricPlanemo implements Planemo, Cullable, HasBodyModel {
    readonly name: string;

    readonly sides: ChunkTree[]; // stores the 6 sides of the sphere

    readonly material: TelluricPlanemoMaterial;

    readonly model: TelluricPlanemoModel;

    readonly onChunkCreatedObservable = new Observable<PlanetChunk>();

    private readonly transform: TransformNode;
    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly parent: OrbitalObject | null;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param scene
     * @param model The model to build the planet or a seed for the planet in [-1, 1]
     * @param parentBody
     */
    constructor(name: string, scene: UberScene, model: TelluricPlanemoModel | number, parentBody: (CelestialBody & HasBodyModel) | null = null) {
        this.name = name;

        this.parent = parentBody;

        this.model = model instanceof TelluricPlanemoModel ? model : new TelluricPlanemoModel(model, parentBody?.model);

        this.transform = new TransformNode(`${name}Transform`, scene);
        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.SHADOW);

        const waterBoilingPoint = waterBoilingPointCelsius(this.model.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (this.model.physicalProperties.pressure > epsilon) {
            if (waterFreezingPoint > this.model.physicalProperties.minTemperature && waterFreezingPoint < this.model.physicalProperties.maxTemperature) {
                this.postProcesses.push(PostProcessType.OCEAN);
            } else {
                this.model.physicalProperties.oceanLevel = 0;
            }
            this.postProcesses.push(PostProcessType.ATMOSPHERE);
        } else {
            this.model.physicalProperties.oceanLevel = 0;
        }

        if (this.model.ringsUniforms !== null) this.postProcesses.push(PostProcessType.RING);
        if (this.model.cloudsUniforms !== null) this.postProcesses.push(PostProcessType.CLOUDS);

        this.material = new TelluricPlanemoMaterial(this.name, this.getTransform(), this.model, scene);

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.getTransform());

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Down, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Forward, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Backward, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Right, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Left, this.name, this.model, this.aggregate, this.material, scene)
        ];

        this.sides.forEach((side) => side.onChunkCreatedObservable.add((chunk) => this.onChunkCreatedObservable.notifyObservers(chunk)));
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): PhysicalProperties {
        return this.model.physicalProperties;
    }

    getRingsUniforms(): RingsUniforms | null {
        return this.model.ringsUniforms;
    }

    getTypeName(): string {
        return "Telluric Planemo";
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     * @param chunkForge
     */
    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge): void {
        for (const side of this.sides) side.update(observerPosition, chunkForge);
    }

    public updateMaterial(controller: Camera, stellarObjects: Transformable[], deltaTime: number): void {
        this.material.update(controller.globalPosition, stellarObjects);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius() + this.model.physicalProperties.oceanLevel;
    }

    public computeCulling(camera: Camera): void {
        for (const side of this.sides) side.computeCulling(camera);
    }

    public dispose(): void {
        for (const side of this.sides) side.dispose();
        this.material.dispose();
        this.aggregate.dispose();
        this.transform.dispose();
    }
}
