import { Axis, Mesh, MeshBuilder } from "@babylonjs/core";

import { AbstractController } from "../../uberCore/abstractController";
import { GasPlanetMaterial } from "../../materials/gasPlanetMaterial";
import { PlanetPostProcesses } from "../common";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planemo } from "./planemo";
import { Star } from "../stellarObjects/star";
import { BlackHole } from "../stellarObjects/blackHole";
import { GasPlanetDescriptor } from "../../descriptors/planemos/gasPlanetDescriptor";

export class GasPlanet extends AbstractBody implements Planemo {
    override readonly postProcesses: PlanetPostProcesses;

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
        super(name, parentBodies);

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

        this.postProcesses = {
            overlay: true,
            atmosphere: true,
            rings: this.descriptor.hasRings
        };

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);
    }

    updateMaterial(controller: AbstractController, stars: (Star | BlackHole)[], deltaTime: number): void {
        this.material.update(controller, stars, this.rotationMatrixAroundAxis, deltaTime);
    }
}
