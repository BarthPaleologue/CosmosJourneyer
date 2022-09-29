import { CollisionData } from "../chunks/workerDataTypes";
import { StarSystem } from "../bodies/starSystem";
import { AbstractController } from "../controllers/abstractController";
import { RigidBody } from "../bodies/interfaces";
import { ITransformable } from "../core/transforms/iTransformable";

export class CollisionWorker {
    _player: AbstractController;
    _busy = false;
    _worker: Worker;
    constructor(player: AbstractController, planetManager: StarSystem) {
        this._worker = new Worker(new URL("workerScript", import.meta.url), { type: "module" });
        this._player = player;
        this._worker.onmessage = (e) => {
            if (player.nearestBody == null) return;

            const direction = player.nearestBody.getAbsolutePosition().normalizeToNew();
            const currentHeight = player.nearestBody.getAbsolutePosition().length();
            const terrainHeight = e.data.h;

            const currentPosition = player.nearestBody.getAbsolutePosition();
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
        const playerSamplePosition = planet.getAbsolutePosition().negate();
        playerSamplePosition.applyRotationQuaternionInPlace(planet.getInverseRotationQuaternion());

        const collisionData = planet.generateCollisionTask(playerSamplePosition);
        this.postMessage(collisionData);
    }
}
