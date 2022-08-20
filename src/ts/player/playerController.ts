import { Vector3, FreeCamera, Scene } from "@babylonjs/core";
import { AbstractBody } from "../bodies/abstractBody";
import { ITransformable } from "../core/transforms/iTransformable";
import { Input } from "../inputs/input";
import { BasicTransform } from "../core/transforms/basicTransform";

export class PlayerController extends BasicTransform implements ITransformable {
    nearestBody: AbstractBody | null;

    collisionRadius = 10;

    camera: FreeCamera;

    speed = 1;

    rotationSpeed = Math.PI / 4;

    readonly inputs: Input[] = [];

    constructor(scene: Scene) {
        super("player");

        this.camera = new FreeCamera("firstPersonCamera", Vector3.Zero(), scene);
        this.camera.parent = this.transform;
        this.camera.fov = (80 / 360) * Math.PI;
        scene.activeCamera = this.camera;

        this.nearestBody = null;
    }

    /**
     * Listens to input, rotate the player accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param input the input to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     */
    public listenTo(input: Input, deltaTime: number): Vector3 {
        // Update Rotation state
        if (input.getRoll() != 0) this.rotate(this.getForwardDirection(), input.getRoll() * this.rotationSpeed * deltaTime);
        if (input.getPitch() != 0) this.rotate(this.getRightDirection(), input.getPitch() * this.rotationSpeed * deltaTime);
        if (input.getYaw() != 0) this.rotate(this.getUpwardDirection(), input.getYaw() * this.rotationSpeed * deltaTime);

        // Update displacement state
        const deplacement = Vector3.Zero();

        const forwardDeplacement = this.getForwardDirection().scale(this.speed * deltaTime);
        const upwardDeplacement = this.getUpwardDirection().scale(this.speed * deltaTime);
        const rightDeplacement = this.getRightDirection().scale(this.speed * deltaTime);

        if (input.getZAxis() != 0) deplacement.addInPlace(forwardDeplacement.scale(input.getZAxis()));
        if (input.getXAxis() != 0) deplacement.addInPlace(rightDeplacement.scale(input.getXAxis()));
        if (input.getYAxis() != 0) deplacement.addInPlace(upwardDeplacement.scale(input.getYAxis()));

        if (input.getAcceleration() != 0) this.speed *= 1 + input.getAcceleration() / 10;

        return deplacement.negate();
    }

    public positionNearBody(body: AbstractBody): void {
        const dir = body.getAbsolutePosition().clone();
        const dist = dir.length();
        dir.normalize();
        this.setAbsolutePosition(dir.scale(dist - body.getRadius() * 3));

        body.starSystem.translateAllBodies(this.getAbsolutePosition().negate());
        this.translate(this.getAbsolutePosition().negate());

        this.transform.lookAt(body.getAbsolutePosition());
    }

    /**
     * If the parameter is unset, returns whereas the player is orbiting a body, if the parameter is set returns if the player orbits the given body
     * @param body the body to check whereas the player is orbiting
     * @param orbitLimitFactor the boundary of the orbit detection (multiplied by planet radius)
     */
    public isOrbiting(body: AbstractBody | null = null, orbitLimitFactor = 2.5): boolean {
        if (this.nearestBody == null) return false;
        else if (body == null) {
            return this.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * this.nearestBody.getRadius()) ** 2;
        } else {
            return this.nearestBody == body && this.nearestBody.getAbsolutePosition().lengthSquared() < (orbitLimitFactor * this.nearestBody.getRadius()) ** 2;
        }
    }

    public getNearestBody(): AbstractBody {
        if (this.nearestBody == null) throw new Error("No nearest body");
        return this.nearestBody;
    }

    public update(deltaTime: number): Vector3 {
        const playerMovement = Vector3.Zero();
        for (const input of this.inputs) {
            playerMovement.addInPlace(this.listenTo(input, deltaTime));
        }
        return playerMovement;
    }
}
