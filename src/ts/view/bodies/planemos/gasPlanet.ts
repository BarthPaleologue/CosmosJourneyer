import { AbstractController } from "../../../controller/uberCore/abstractController";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../../controller/uberCore/uberScene";
import { Planemo, PlanemoMaterial } from "./planemo";
import { GasPlanetModel } from "../../../model/planemos/gasPlanetModel";
import { StellarObject } from "../stellarObjects/stellarObject";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { isSizeOnScreenEnough } from "../../../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { PhysicsShapeSphere } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class GasPlanet extends AbstractBody implements Planemo, PlanemoMaterial {
    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    readonly model: GasPlanetModel;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: UberScene, model: GasPlanetModel | number, parentBody?: AbstractBody) {
        super(name, scene, parentBody);

        this.model = model instanceof GasPlanetModel ? model : new GasPlanetModel(model, parentBody?.model);

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.model.radius * 2,
                segments: 32
            },
            scene
        );
        this.mesh.parent = this.getTransform();

        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.material = new GasPlanetMaterial(this.name, this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        this.postProcesses.push(PostProcessType.ATMOSPHERE, PostProcessType.SHADOW);
        if (this.model.ringsUniforms !== null) this.postProcesses.push(PostProcessType.RING);

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void {
        this.material.update(controller, stellarObjects, deltaTime);
    }

    public override computeCulling(camera: Camera): void {
        this.mesh.isVisible = isSizeOnScreenEnough(this, camera);
    }

    public override dispose(): void {
        this.aggregate.dispose();
        this.mesh.dispose();
        this.material.dispose();
        super.dispose();
    }
}
