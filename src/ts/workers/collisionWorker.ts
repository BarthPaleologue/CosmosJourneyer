import { CollisionData } from "../chunks/workerDataTypes";
import { StarSystem } from "../bodies/starSystem";
import { AbstractController } from "../uberCore/abstractController";
import { RigidBody } from "../bodies/interfaces";
import { ITransformable } from "../orbits/iOrbitalBody";

export class CollisionWorker {
    currentBody: (RigidBody & ITransformable) | null = null;
    _busy = false;
    _worker: Worker;
    constructor(player: AbstractController, planetManager: StarSystem) {
        this._worker = new Worker(new URL("workerScript", import.meta.url), { type: "module" });
        this._worker.onmessage = (e) => {
            if (this.currentBody == null) return;

            const direction = this.currentBody.transform.getAbsolutePosition().normalizeToNew();
            const currentHeight = this.currentBody.transform.getAbsolutePosition().length();
            const terrainHeight = e.data.h;

            const currentPosition = this.currentBody.transform.getAbsolutePosition();
            let newPosition = currentPosition;

            if (currentHeight - player.collisionRadius < terrainHeight) {
                newPosition = direction.scale(terrainHeight + player.collisionRadius);
            }

            const deviation = newPosition.subtract(currentPosition);

            planetManager.translateAllBodies(deviation);

            this._busy = false;
        };
    }
    public isBusy(): boolean {
        return this._busy;
    }
    public postMessage(data: CollisionData): void {
        this._worker.postMessage(data);
        this._busy = true;
    }
    public checkCollision(planet: RigidBody & ITransformable): void {
        this.currentBody = planet;
        const playerSamplePosition = planet.transform.getAbsolutePosition().negate();
        playerSamplePosition.applyRotationQuaternionInPlace(planet.transform.getInverseRotationQuaternion());

        const collisionData = planet.generateCollisionTask(playerSamplePosition);
        this.postMessage(collisionData);
    }
}
