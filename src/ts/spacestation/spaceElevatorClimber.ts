import { Scene } from "@babylonjs/core/scene";
import { CreateBox, CreateTube, TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export class SpaceElevatorClimber implements Transformable {
    private readonly transform: TransformNode;

    constructor(scene: Scene) {
        this.transform = new TransformNode("SpaceElevatorClimber", scene);

        const angleSubtracted = Math.PI / 6;
        const minAngle = -Math.PI / 2 + angleSubtracted / 2;
        const maxAngle = Math.PI / 2 - angleSubtracted / 2;
        const nbPoints = 64;

        const globalRadius = 100;
        const innerRadius = 10;

        const yThickness = 0.5;

        const rightPath = [];
        for (let theta = minAngle; theta <= maxAngle; theta += (maxAngle - minAngle) / nbPoints) {
            const x = Math.cos(theta) * globalRadius;
            const z = Math.sin(theta) * globalRadius;
            rightPath.push(new Vector3(x, 0, z));
        }

        const rightRing = CreateTube(
            "ClimberRightRing",
            {
                path: rightPath,
                cap: Mesh.CAP_ALL,
                radius: innerRadius
            },
            scene
        );
        rightRing.scaling.y = yThickness;
        rightRing.parent = this.transform;

        const leftRing = rightRing.clone("ClimberLeftRing");
        leftRing.rotate(Axis.Y, Math.PI);

        const arm1 = CreateBox(
            "ClimberArm1",
            {
                width: globalRadius * 2,
                height: innerRadius * yThickness / 4,
                depth: innerRadius * yThickness / 4
            },
            scene
        );
        arm1.parent = this.transform;

        const arm2 = arm1.clone("ClimberArm2");
        arm2.rotate(Axis.Y, Math.PI / 4);
        arm2.parent = this.transform;

        const arm3 = arm1.clone("ClimberArm3");
        arm3.rotate(Axis.Y, -Math.PI / 4);
        arm3.parent = this.transform;

        const solarPanelWidth = 100;
        const solarPanelDepth = 20;
        const solarPanelThickness = 0.1;

        const solarPanelAngleSpacing = Math.PI / 6;

        const solarPanel1 = CreateBox(
            "ClimberSolarPanel1",
            {
                width: solarPanelWidth,
                height: solarPanelThickness,
                depth: solarPanelDepth
            },
            scene
        );
        solarPanel1.position.x = globalRadius + solarPanelWidth / 2;
        solarPanel1.parent = this.transform;

        const angles = [solarPanelAngleSpacing, -solarPanelAngleSpacing, Math.PI + solarPanelAngleSpacing, Math.PI - solarPanelAngleSpacing, Math.PI];

        angles.forEach((angle, index) => {
            const solarPanel2 = solarPanel1.clone(`ClimberSolarPanel${index + 2}`);
            solarPanel2.parent = this.transform;
            solarPanel2.rotateAround(Vector3.Zero(), Axis.Y, angle);
        });
    }

    getTransform() {
        return this.transform;
    }

    dispose() {
        this.transform.dispose();
    }
}
