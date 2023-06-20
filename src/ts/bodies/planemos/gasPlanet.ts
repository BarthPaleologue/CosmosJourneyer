import { AbstractController } from "../../uberCore/abstractController";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planemo } from "./planemo";
import { GasPlanetDescriptor } from "../../descriptors/planemos/gasPlanetDescriptor";
import { StellarObject } from "../stellarObjects/stellarObject";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";

export class GasPlanet extends AbstractBody implements Planemo {
    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    readonly descriptor: GasPlanetDescriptor;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies, scene);

        this.descriptor = new GasPlanetDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.descriptor.radius * 2,
                segments: 64
            },
            scene
        );
        this.mesh.parent = this.transform.node;

        this.material = new GasPlanetMaterial(this.name, this.transform, this.descriptor, scene);
        this.mesh.material = this.material;

        this.postProcesses.push(PostProcessType.OVERLAY, PostProcessType.ATMOSPHERE, PostProcessType.RING);

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);
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
