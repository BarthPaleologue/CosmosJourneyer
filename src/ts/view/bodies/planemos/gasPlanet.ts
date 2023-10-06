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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { isSizeOnScreenEnough } from "../../../utils/isObjectVisibleOnScreen";

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
                segments: 64
            },
            scene
        );
        this.mesh.parent = this.transform;

        this.material = new GasPlanetMaterial(this.name, this.transform, this.model, scene);
        this.mesh.material = this.material;

        this.postProcesses.push(PostProcessType.OVERLAY, PostProcessType.ATMOSPHERE, PostProcessType.RING, PostProcessType.SHADOW);

        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void {
        this.material.update(controller, stellarObjects, deltaTime);
    }

    public override computeCulling(cameraPosition: Vector3): void {
        this.mesh.isVisible = isSizeOnScreenEnough(this, cameraPosition);
    }

    public override dispose(): void {
        this.mesh.dispose();
        this.material.dispose();
        super.dispose();
    }
}
