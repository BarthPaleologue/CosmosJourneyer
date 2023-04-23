import { TransferCollisionData } from "../chunks/workerDataTypes";
import { StarSystem } from "../bodies/starSystem";
import { AbstractController } from "../uberCore/abstractController";
import { ITransformable } from "../orbits/iOrbitalObject";
import { RigidBody } from "./rigidbody";

export class CollisionWorker {
    private currentBody: (RigidBody & ITransformable) | null = null;
    private _isBusy = false;
    private worker: Worker;
    private starSystem: StarSystem | null = null;
    private player: AbstractController | null = null;

    constructor(player: AbstractController | null = null, starSystem: StarSystem | null = null) {
        this.starSystem = starSystem;
        this.player = player;

        this.worker = new Worker(new URL("collisionScript", import.meta.url), { type: "module" });
        this.worker.onmessage = (e) => {
            if (this.starSystem === null || this.player === null || this.currentBody === null) return;

            const direction = this.currentBody.transform.getAbsolutePosition().normalizeToNew();
            const currentHeight = this.currentBody.transform.getAbsolutePosition().length();
            const terrainHeight = e.data.h;

            const currentPosition = this.currentBody.transform.getAbsolutePosition();
            let newPosition = currentPosition;

            if (currentHeight - this.player.collisionRadius < terrainHeight) {
                newPosition = direction.scale(terrainHeight + this.player.collisionRadius);
            }

            const deviation = newPosition.subtract(currentPosition);

            this.starSystem.translateEverythingNow(deviation);

            this._isBusy = false;
        };
    }

    public setStarSystem(starSystem: StarSystem): void {
        this.starSystem = starSystem;
    }

    public setPlayer(player: AbstractController): void {
        this.player = player;
    }

    public isBusy(): boolean {
        return this._isBusy;
    }

    private postMessage(data: TransferCollisionData): void {
        this.worker.postMessage(data);
        this._isBusy = true;
    }

    public checkCollision(planet: RigidBody & ITransformable): void {
        this.currentBody = planet;
        const playerSamplePosition = planet.transform.getAbsolutePosition().negate();
        playerSamplePosition.applyRotationQuaternionInPlace(planet.transform.getInverseRotationQuaternion());

        const collisionData = planet.generateCollisionTask(playerSamplePosition);
        this.postMessage(collisionData);
    }
}
