import {CollisionData} from "../forge/workerDataInterfaces";
import {StarSystemManager} from "../celestialBodies/starSystemManager";
import {PlayerController} from "../player/playerController";
import {RigidBody, Transformable} from "../celestialBodies/interfaces";

export class CollisionWorker {
    _player: PlayerController;
    _busy = false;
    _worker: Worker;
    constructor(player: PlayerController, planetManager: StarSystemManager) {
        this._worker = new Worker(new URL('workerScript', import.meta.url), { type: "module" });
        this._player = player;
        this._worker.onmessage = e => {
            if (player.nearestBody == null) return;

            let direction = player.nearestBody.getAbsolutePosition().normalizeToNew();
            let currentHeight = player.nearestBody.getAbsolutePosition().length();
            let terrainHeight = e.data.h;

            let currentPosition = player.nearestBody.getAbsolutePosition();
            let newPosition = currentPosition;

            if (currentHeight - player.collisionRadius < terrainHeight) {
                newPosition = direction.scale(terrainHeight + player.collisionRadius);
            }

            let deviation = newPosition.subtract(currentPosition);

            planetManager.moveEverything(deviation);

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
    public checkCollision(planet: RigidBody & Transformable): void {

        let playerSamplePosition = planet.getOriginBodySpaceSamplePosition();

        let collisionData = planet.generateCollisionTask(playerSamplePosition);
        this.postMessage(collisionData);

    }
}