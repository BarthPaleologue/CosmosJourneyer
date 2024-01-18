import { GasPlanetMaterial } from "./gasPlanetMaterial";
import { UberScene } from "../../uberCore/uberScene";
import { GasPlanetModel } from "./gasPlanetModel";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Transformable } from "../../uberCore/transforms/basicTransform";
import { Planemo } from "../../architecture/planemo";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { HasBodyModel, PhysicalProperties } from "../../model/common";
import { TransformNode } from "@babylonjs/core/Meshes";
import { CelestialBody } from "../../architecture/celestialBody";
import { OrbitalObject } from "../../architecture/orbitalObject";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Cullable } from "../../bodies/cullable";
import { RingsUniforms } from "../../postProcesses/rings/ringsUniform";

export class GasPlanet implements Planemo, Cullable, HasBodyModel {
    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    readonly aggregate: PhysicsAggregate;
    readonly model: GasPlanetModel;

    name: string;
    parent: OrbitalObject | null;
    postProcesses: PostProcessType[] = [];

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: UberScene, model: GasPlanetModel | number, parentBody: (CelestialBody & HasBodyModel) | null = null) {
        this.name = name;

        this.parent = parentBody;

        this.model = model instanceof GasPlanetModel ? model : new GasPlanetModel(model, parentBody?.model);

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.model.radius * 2,
                segments: 32
            },
            scene
        );

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
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.material = new GasPlanetMaterial(this.name, this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        this.postProcesses.push(PostProcessType.ATMOSPHERE, PostProcessType.SHADOW);
        if (this.model.ringsUniforms !== null) this.postProcesses.push(PostProcessType.RING);

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    updateMaterial(controller: Camera, stellarObjects: Transformable[], deltaTime: number): void {
        this.material.update(controller, stellarObjects, deltaTime);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.model.radius;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getRingsUniforms(): RingsUniforms | null {
        return this.model.ringsUniforms;
    }

    getTypeName(): string {
        return "Gas Planet";
    }

    public computeCulling(camera: Camera): void {
        this.mesh.isVisible = isSizeOnScreenEnough(this, camera);
    }

    public dispose(): void {
        this.mesh.dispose();
        this.aggregate.dispose();
        this.material.dispose();
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): PhysicalProperties {
        return this.model.physicalProperties;
    }

    getTransform(): TransformNode {
        return this.mesh;
    }
}
