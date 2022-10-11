import { Vector3 } from "@babylonjs/core";
import { AbstractBody } from "../bodies/abstractBody";
import { Input } from "../inputs/input";
import { BasicTransform } from "../core/transforms/basicTransform";
import { UberFreeCamera } from "../core/uberFreeCamera";

export abstract class AbstractController {
    nearestBody: AbstractBody | null;

    collisionRadius = 10;

    readonly transform: BasicTransform;

    /**
     * The inputs that this controller listens to
     */
    readonly inputs: Input[] = [];

    protected constructor() {
        this.transform = new BasicTransform("playerTransform");
        this.nearestBody = null;
    }

    /**
     * Returns the camera that should be used to display the player
     */
    abstract getActiveCamera(): UberFreeCamera;

    /**
     * Listens to input, rotate the controller accordingly and computes equivalent displacement (the player is fixed at the origin)
     * @param input the input to listen to
     * @param deltaTime the time between 2 frames
     * @returns the negative displacement of the player to apply to every other mesh given the inputs
     * @internal
     */
    abstract listenTo(input: Input, deltaTime: number): Vector3;

    public positionNearBody(body: AbstractBody, nRadius = 3): void {
        const dir = body.getAbsolutePosition().clone();
        const dist = dir.length();
        if (dist > 0) {
            dir.normalize();
            this.transform.setAbsolutePosition(dir.scale(dist - body.getRadius() * nRadius));
        } else {
            this.transform.setAbsolutePosition(new Vector3(0, 0.2, 1).scaleInPlace(body.getRadius() * nRadius));
        }

        body.starSystem.translateAllBodies(this.transform.getAbsolutePosition().negate());
        this.transform.translate(this.transform.getAbsolutePosition().negate());

        this.transform.node.lookAt(body.getAbsolutePosition());
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

    /**
     * Makes the controller listen to all its inputs and returns the displacement to apply to the player
     * @param deltaTime the time between 2 frames
     */
    abstract update(deltaTime: number): Vector3;
}
