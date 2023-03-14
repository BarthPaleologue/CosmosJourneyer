import { AbstractBody } from "../abstractBody";

import { Mesh, MeshBuilder, PointLight, Quaternion, Vector3 } from "@babylonjs/core";
import { StarPostProcesses } from "../common";
import { StarMaterial } from "../../materials/starMaterial";
import { UberScene } from "../../uberCore/uberScene";
import { getRgbFromTemperature } from "../../utils/specrend";
import { StarDescriptor } from "../../descriptors/stellarObjects/starDescriptor";
export class Star extends AbstractBody {
    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    public override postProcesses: StarPostProcesses;

    readonly descriptor: StarDescriptor;

    /**
     * New Star
     * @param name The name of the star
     * @param scene
     * @param seed The seed of the star in [-1, 1]
     * @param parentBodies The bodies the star is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies);

        this.descriptor = new StarDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.mesh = MeshBuilder.CreateSphere(
            `${name}Mesh`,
            {
                diameter: this.descriptor.radius * 2,
                segments: 32
            },
            scene
        );
        this.mesh.parent = this.transform.node;

        this.light = new PointLight(`${name}Light`, Vector3.Zero(), scene);
        this.light.diffuse.fromArray(getRgbFromTemperature(this.descriptor.physicalProperties.temperature).asArray());
        this.light.parent = this.transform.node;

        this.material = new StarMaterial(this.transform, this.descriptor, scene);
        this.mesh.material = this.material;

        // TODO: remove when rotation is transmitted to children
        this.transform.node.rotationQuaternion = Quaternion.Identity();

        this.postProcesses = {
            overlay: true,
            volumetricLight: true,
            rings: false
        };

        if (this.descriptor.hasRings) this.postProcesses.rings = true;
    }

    public updateMaterial(): void {
        this.material.update(this.getInternalClock());
    }
}
