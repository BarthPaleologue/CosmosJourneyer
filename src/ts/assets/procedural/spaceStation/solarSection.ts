import { wheelOfFortune } from "../../../utils/wheelOfFortune";
import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis, Scene } from "@babylonjs/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Space } from "@babylonjs/core/Maths/math.axis";

export class SolarSection implements Transformable {
    private readonly attachment: Mesh;

    private readonly arms: Mesh[] = [];

    constructor(requiredSurface: number, scene: Scene) {
        const nbArms = wheelOfFortune(
            [
                [1, 0.2],
                [2, 0.3],
                [3, 0.3],
                [4, 0.2]
            ],
            Math.random()
        );

        let attachmentLength = 200;

        if (nbArms === 1) {
            // in this case we will need a larger body to fit all the panels on the main attachment
            const sideSurface = requiredSurface / 2;
            const squareSideSize = Math.sqrt(sideSurface);

            attachmentLength = squareSideSize / 1.618;
        }

        this.attachment = MeshBuilder.CreateCylinder(
            "SolarSectionAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: attachmentLength,
                tessellation: nbArms
            },
            scene
        );

        console.log("Nb arms", nbArms);

        if(nbArms > 1) {
            // there will be two solar array per arm, so the surface is distributed over 2*nbArms
            const surfacePerArm = requiredSurface / (2 * nbArms);
            const squareSideSize = Math.sqrt(surfacePerArm);
            const armLength = squareSideSize * 1.618;
            for (let i = 0; i <= nbArms; i++) {
                const arm = MeshBuilder.CreateBox(
                    `RingHabitatArm${i}`,
                    {
                        width: armLength,
                        depth: 100,
                        height: 100
                    },
                    scene
                );

                const theta = (i / nbArms) * Math.PI * 2;
                arm.rotate(Axis.Y, theta, Space.WORLD);
                arm.translate(Axis.X, armLength / 2, Space.LOCAL);
                arm.parent = this.getTransform();
                this.arms.push(arm);
            }
        }
    }

    public getTransform(): TransformNode {
        return this.attachment;
    }

    public dispose() {
        this.getTransform().dispose();
    }
}