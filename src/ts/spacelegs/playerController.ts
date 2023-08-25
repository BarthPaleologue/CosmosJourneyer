import { AbstractController } from "../controller/uberCore/abstractController";
import { UberCamera } from "../controller/uberCore/uberCamera";
import { Input, InputType } from "../controller/inputs/input";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { getForwardDirection, getRightDirection, getUpwardDirection, pitch, roll, translate, yaw } from "../controller/uberCore/transforms/basicTransform";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setEnabledBody } from "../utils/havok";
import { Settings } from "../settings";

export class PlayerController extends AbstractController {
    private readonly camera: UberCamera;

    readonly aggregate: PhysicsAggregate;

    private readonly sphereCollider: PhysicsShapeSphere;

    speed = 1;
    rotationSpeed = Math.PI / 4;

    constructor(scene: Scene) {
        super();

        const transform = new TransformNode("playerController", scene);

        this.sphereCollider = new PhysicsShapeSphere(Vector3.Zero(), 10, scene);

        this.aggregate = new PhysicsAggregate(transform, PhysicsShapeType.SPHERE, { mass: 0 }, scene);
        this.aggregate.body.disablePreStep = false;

        this.camera = new UberCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.aggregate.transformNode;
        this.camera.fov = (80 / 360) * Math.PI;
    }

    public setEnabled(enabled: boolean, havokPlugin: HavokPlugin) {
        setEnabledBody(this.aggregate.body, enabled, havokPlugin);
    }

    public override getActiveCamera(): UberCamera {
        return this.camera;
    }

    protected override listenTo(input: Input, deltaTime: number): Vector3 {
        if (input.type !== InputType.KEYBOARD) return Vector3.Zero();
        roll(this.aggregate.transformNode, input.getRoll() * this.rotationSpeed * deltaTime);
        pitch(this.aggregate.transformNode, input.getPitch() * this.rotationSpeed * deltaTime);
        yaw(this.aggregate.transformNode, input.getYaw() * this.rotationSpeed * deltaTime);

        const displacement = Vector3.Zero();

        const forwardDisplacement = getForwardDirection(this.aggregate.transformNode)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getZAxis());
        const upwardDisplacement = getUpwardDirection(this.aggregate.transformNode)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getYAxis());
        const rightDisplacement = getRightDirection(this.aggregate.transformNode)
            .scale(this.speed * deltaTime)
            .scaleInPlace(input.getXAxis());

        displacement.addInPlace(forwardDisplacement);
        displacement.addInPlace(upwardDisplacement);
        displacement.addInPlace(rightDisplacement);

        if (input.getAcceleration() != 0) this.speed *= 1 + input.getAcceleration() / 10;

        return displacement;
    }

    public override update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        //FIXME: the division by Settings.TIME_MULTIPLIER is a hack to make the player move at the same speed regardless of the time multiplier
        for (const input of this.inputs) playerMovement.addInPlace(this.listenTo(input, deltaTime / Settings.TIME_MULTIPLIER));
        translate(this.aggregate.transformNode, playerMovement);
        return playerMovement;
    }
}
